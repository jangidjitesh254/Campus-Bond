import Event from '../models/Event.js';
import User from '../models/User.js';
import {
  calculateMatchScore,
  generateMatchExplanation,
  extractSkillsFromTextWithAI,
  parseFreeformMatchQuery,
  normalizeSkill,
} from '../services/skillMatchService.js';

/**
 * Get projects / hackathons ranked by AI skill match for current student.
 * GET /api/skill-match/events
 */
export async function getMatchedEvents(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userSkills = user.skills || [];

    // Find all open events not created by current user
    const events = await Event.find({
      status: 'open',
      createdBy: { $ne: user._id },
    })
      .populate('createdBy', 'name branch semester avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate match scores
    const scoredEvents = events.map((event) => {
      const match = calculateMatchScore(userSkills, event.skillsNeeded || []);
      const isApplied = (event.applicants || []).some(
        (a) => String(a.user) === String(user._id)
      );
      const isApproved = (event.applicants || []).some(
        (a) => String(a.user) === String(user._id) && a.status === 'approved'
      );

      return {
        ...event,
        matchPercentage: match.matchPercentage,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        fitLevel: match.fitLevel,
        isApplied,
        isApproved,
      };
    });

    // Sort: highest match score first, then newest
    scoredEvents.sort((a, b) => b.matchPercentage - a.matchPercentage || b.createdAt - a.createdAt);

    // Enrich top 4 matches with AI explanations
    const topMatches = scoredEvents.slice(0, 4);
    await Promise.allSettled(
      topMatches.map(async (item) => {
        try {
          const aiExp = await generateMatchExplanation({
            user,
            event: item,
            matchedSkills: item.matchedSkills,
            missingSkills: item.missingSkills,
            matchPercentage: item.matchPercentage,
          });
          item.aiExplanation = aiExp.explanation;
          item.suggestedRole = aiExp.suggestedRole;
        } catch (err) {
          // fallback generated in service
        }
      })
    );

    res.status(200).json({
      events: scoredEvents,
      userSkills,
      totalMatched: scoredEvents.filter((e) => e.matchPercentage > 0).length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to calculate matched events' });
  }
}

/**
 * Find recommended teammates for an event or target list of skills.
 * GET /api/skill-match/teammates?eventId=... OR ?skills=React,PyTorch
 */
export async function getMatchedTeammates(req, res) {
  try {
    const { eventId, skills } = req.query;
    let targetSkills = [];
    let eventContext = null;

    if (eventId) {
      const event = await Event.findById(eventId).lean();
      if (!event) return res.status(404).json({ message: 'Event not found' });
      targetSkills = event.skillsNeeded || [];
      eventContext = event;
    } else if (skills) {
      targetSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (targetSkills.length === 0) {
      return res.status(400).json({ message: 'Please provide either an eventId or skills list.' });
    }

    // Find all verified students except current user
    const students = await User.find({
      _id: { $ne: req.user._id },
      isVerified: true,
    })
      .select('name email branch semester avatar campusScore skills bio interests githubUrl')
      .lean();

    const scoredStudents = students
      .map((student) => {
        const studentSkills = student.skills || [];
        const match = calculateMatchScore(studentSkills, targetSkills);

        return {
          ...student,
          matchPercentage: match.matchPercentage,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          fitLevel: match.fitLevel,
        };
      })
      .filter((s) => s.matchPercentage > 0 || (s.skills && s.skills.length > 0));

    // Sort by match score descending
    scoredStudents.sort((a, b) => b.matchPercentage - a.matchPercentage || (b.campusScore || 0) - (a.campusScore || 0));

    res.status(200).json({
      candidates: scoredStudents,
      targetSkills: targetSkills.map(normalizeSkill),
      eventTitle: eventContext?.title || null,
      totalCandidates: scoredStudents.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to match teammates' });
  }
}

/**
 * Natural language conversational match query.
 * POST /api/skill-match/query   body: { query: "Need a Flutter dev for SIH" }
 */
export async function searchSkillMatches(req, res) {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Query string is required.' });
    }

    const parsed = await parseFreeformMatchQuery(query);
    const { targetType, skills, intent, branchPreference, category } = parsed;

    let studentResults = [];
    let eventResults = [];

    if (targetType === 'students' || skills.length > 0) {
      // Search students
      const studentFilter = { _id: { $ne: req.user._id }, isVerified: true };
      if (branchPreference) {
        studentFilter.branch = { $regex: branchPreference, $options: 'i' };
      }

      const students = await User.find(studentFilter)
        .select('name email branch semester avatar campusScore skills bio interests githubUrl')
        .lean();

      studentResults = students
        .map((st) => {
          const match = calculateMatchScore(st.skills || [], skills);
          return {
            ...st,
            matchPercentage: match.matchPercentage,
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
          };
        })
        .filter((s) => s.matchPercentage >= 20 || (s.skills && s.skills.length > 0))
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 12);
    }

    if (targetType === 'projects' || studentResults.length === 0) {
      // Search events
      const eventFilter = { status: 'open', createdBy: { $ne: req.user._id } };
      if (category && category !== 'all') {
        eventFilter.category = category;
      }

      const events = await Event.find(eventFilter)
        .populate('createdBy', 'name branch semester avatar')
        .lean();

      eventResults = events
        .map((ev) => {
          const match = calculateMatchScore(skills, ev.skillsNeeded || []);
          return {
            ...ev,
            matchPercentage: match.matchPercentage,
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
          };
        })
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 10);
    }

    res.status(200).json({
      parsed: {
        query,
        targetType,
        skills,
        intent,
        branchPreference,
      },
      students: studentResults,
      events: eventResults,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Skill search failed' });
  }
}

/**
 * AI Skills Extractor from raw text (Resume, Bio, Projects).
 * POST /api/skill-match/extract   body: { text: "..." }
 */
export async function extractSkillsFromText(req, res) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Text input is required.' });
    }

    const skills = await extractSkillsFromTextWithAI(text);
    res.status(200).json({ skills });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Skills extraction failed' });
  }
}
