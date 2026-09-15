import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Event from '../models/Event.js';
import MarketItem from '../models/MarketItem.js';
import LostItem from '../models/LostItem.js';
import Club from '../models/Club.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export async function seedDemoDataIfEmpty() {
  try {
    await User.updateMany({ email: 'test@campusbond.edu' }, { $set: { name: 'Vikash' } });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Ensure student users exist with diverse skills & profiles for AI matching
    const seedStudents = [
      {
        email: '21bcon101@vgu.ac.in',
        name: 'Jitesh Jangir',
        branch: 'CSE',
        semester: 6,
        campusScore: 150,
        skills: ['React', 'Node.js', 'MongoDB', 'Express', 'Tailwind CSS', 'System Design'],
        bio: '6th sem CSE at VGU. Passionate full-stack developer and campus tech community lead.',
        interests: ['Full-Stack Development', 'Hackathons', 'System Design'],
      },
      {
        email: 'test@campusbond.edu',
        name: 'Vikash',
        branch: 'CSE',
        semester: 4,
        campusScore: 50,
        skills: ['React', 'Node.js', 'JavaScript', 'Tailwind CSS', 'Python', 'UI/UX Design'],
        bio: '4th semester CSE student passionate about full-stack web development, hackathons, and AI tools.',
        interests: ['Hackathons', 'Web Development', 'Open Source', 'UI Design'],
      },
      {
        email: 'student@campusbond.edu',
        name: 'Aarav Sharma',
        branch: 'CSE',
        semester: 6,
        campusScore: 120,
        skills: ['C++', 'Algorithms', 'Data Structures', 'Python', 'Competitive Programming', 'React'],
        bio: '6th sem CSE. ICPC Amritapuri regional qualifier. Solves complex algorithmic challenges and systems architecture.',
        interests: ['Competitive Programming', 'Algorithms', 'Backend Systems'],
      },
      {
        email: 'ananya@campusbond.edu',
        name: 'Ananya Gupta',
        branch: 'AI & DS',
        semester: 4,
        campusScore: 85,
        skills: ['Python', 'Machine Learning', 'AI/ML', 'PyTorch', 'Computer Vision', 'Deep Learning'],
        bio: '4th sem AI & Data Science. Computer vision and biomedical image segmentation researcher. Active Kaggle competitor.',
        interests: ['Artificial Intelligence', 'Computer Vision', 'Kaggle', 'PyTorch'],
      },
      {
        email: 'rohan@campusbond.edu',
        name: 'Rohan Verma',
        branch: 'Mechanical',
        semester: 6,
        campusScore: 90,
        skills: ['Robotics', 'ROS (Robotics)', 'C++', 'SolidWorks', 'Fusion 360', 'Embedded Systems'],
        bio: 'Mechanical engineering 6th sem. Building autonomous UGVs and robotic arms. CAD modeller and 3D printing enthusiast.',
        interests: ['Robotics', 'Autonomous Vehicles', 'Hardware Prototyping'],
      },
      {
        email: 'priya@campusbond.edu',
        name: 'Priya Singh',
        branch: 'ECE',
        semester: 4,
        campusScore: 110,
        skills: ['Arduino', 'ESP32 / Embedded', 'IoT', 'Hardware', 'Bluetooth LE', 'C++'],
        bio: 'ECE 4th sem. IoT and sensor systems geek. Passionate about connected healthcare hardware and smart campus sensors.',
        interests: ['IoT', 'Smart Hardware', 'Sensor Networks', 'Microcontrollers'],
      },
      {
        email: 'kabir@campusbond.edu',
        name: 'Kabir Mehra',
        branch: 'Design & Media',
        semester: 5,
        campusScore: 75,
        skills: ['UI/UX Design', 'Figma', 'Video Editing', 'Photography', 'Adobe Illustrator', 'Graphic Design'],
        bio: 'Design & Media student. Crafting clean mobile interfaces, design systems, and directing campus cultural documentaries.',
        interests: ['Product Design', 'Cinematography', 'Creative Direction'],
      },
      {
        email: 'neha@campusbond.edu',
        name: 'Neha Patel',
        branch: 'EEE',
        semester: 6,
        campusScore: 105,
        skills: ['MATLAB', 'Simulink', 'Altium PCB', 'CAN Bus', 'Embedded C', 'Electrical Systems'],
        bio: 'EEE 6th sem. Lead electrical engineer for Formula Student. BMS architecture, power electronics, and custom PCB layout.',
        interests: ['Electric Vehicles', 'Power Electronics', 'Formula Bharat'],
      },
      {
        email: 'aditya@campusbond.edu',
        name: 'Aditya Roy',
        branch: 'IT',
        semester: 5,
        campusScore: 95,
        skills: ['Solidity / Web3', 'Web3', 'Flutter', 'Smart Contracts', 'React', 'Cloud & DevOps'],
        bio: '5th sem IT. Building decentralized identity protocols and cross-platform mobile apps for collegiate events.',
        interests: ['Web3', 'Mobile Engineering', 'Distributed Systems'],
      },
      {
        email: 'siddharth@campusbond.edu',
        name: 'Siddharth Jain',
        branch: 'CSE',
        semester: 3,
        campusScore: 60,
        skills: ['Three.js', 'WebGL', 'Python', 'CyberSecurity', 'Reverse Engineering', 'CTF / Security'],
        bio: '3rd sem CSE. 3D creative web developer by day, CTF player and binary exploitation researcher by night.',
        interests: ['3D Web Graphics', 'Cyber Security', 'CTF Challenges'],
      },
      {
        email: 'tanvi@campusbond.edu',
        name: 'Tanvi Kulkarni',
        branch: 'Civil & Env',
        semester: 5,
        campusScore: 80,
        skills: ['React Native', 'Firebase', 'Logistics', 'UI/UX Design', 'Event Management'],
        bio: 'Civil & Environmental engineering. Building sustainability tech and coordinating university food redistribution programs.',
        interests: ['Sustainability Tech', 'Community Organizing', 'App Development'],
      },
    ];

    const studentMap = {};
    for (const s of seedStudents) {
      const userDoc = await User.findOneAndUpdate(
        { email: s.email },
        {
          $set: {
            name: s.name,
            branch: s.branch,
            semester: s.semester,
            campusScore: s.campusScore,
            skills: s.skills,
            bio: s.bio,
            interests: s.interests,
            isVerified: true,
            passwordHash,
          },
        },
        { upsert: true, new: true }
      );
      studentMap[s.email] = userDoc;
    }

    const vguUser = studentMap['21bcon101@vgu.ac.in'];
    const demoUser = studentMap['student@campusbond.edu'];
    const testUser = studentMap['test@campusbond.edu'];
    const devUser = studentMap['ananya@campusbond.edu'];
    const rohanUser = studentMap['rohan@campusbond.edu'];
    const priyaUser = studentMap['priya@campusbond.edu'];
    const kabirUser = studentMap['kabir@campusbond.edu'];
    const nehaUser = studentMap['neha@campusbond.edu'];
    const adityaUser = studentMap['aditya@campusbond.edu'];
    const siddharthUser = studentMap['siddharth@campusbond.edu'];
    const tanviUser = studentMap['tanvi@campusbond.edu'];

    // 2. Seed 20 Team Collaboration / Hackathon Posts
    const eventCount = await Event.countDocuments();
    if (eventCount < 20) {
      if (eventCount > 0) {
        console.log('🔄 Refreshing sample events to full 20 posts...');
        await Event.deleteMany({});
      }
      console.log('🌱 Seeding 20 realistic campus team formation posts for demo...');
      await Event.create([
      {
        title: 'Smart India Hackathon 2026: Need Frontend & ML Teammates',
        description:
          'Working on an AI-driven energy audit system for institutional campuses. We currently have a backend engineer and hardware lead. Looking for a React/Tailwind frontend developer and an ML student with OpenCV/PyTorch experience.',
        category: 'hackathon',
        skillsNeeded: ['React', 'Tailwind', 'AI/ML', 'PyTorch', 'UI/UX'],
        teamSize: 4,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: demoUser._id,
        applicants: [
          {
            user: devUser._id,
            message: 'Hey Aarav! I have built vision models in PyTorch and would love to collaborate on the energy audit project.',
            status: 'approved',
          },
        ],
        comments: [
          {
            user: devUser._id,
            text: 'Is this project targeting the software or hardware edition?',
          },
          {
            user: testUser._id,
            text: 'Can I join as a frontend contributor?',
          },
        ],
      },
      {
        title: 'Autonomous Drone Navigation & Obstacle Avoidance',
        description:
          'Building an ROS-based autonomous drone for the inter-college robotics symposium. Looking for teammates with experience in embedded C++, PX4 autopilot, or 3D chassis design in Fusion360.',
        category: 'project',
        skillsNeeded: ['ROS', 'C++', 'Fusion360', 'Embedded Systems'],
        teamSize: 3,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: devUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'FinTech Hackathon: Cross-Campus Micro-Investment App',
        description:
          'Assembling a 3-person team for the National FinTech Challenge. We need a designer who understands Figma and mobile interaction patterns, plus a Flutter/React Native coder.',
        category: 'competition',
        skillsNeeded: ['Figma', 'Flutter', 'FinTech', 'API Design'],
        teamSize: 3,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: demoUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Campus Short Film & Annual Cultural Showcase',
        description:
          'Shooting a 12-minute campus drama for the State Youth Festival. Need video editors (Premiere Pro / DaVinci), sound recorder, and 2 actors from any semester.',
        category: 'cultural',
        skillsNeeded: ['Video Editing', 'Acting', 'Sound Design', 'Storyboarding'],
        teamSize: 5,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: kabirUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'NASA Space Apps Challenge 2026: Satellite Data Visualizer',
        description:
          'Developing a high-performance 3D Earth observation web app to track deforestation and urban heat islands using Copernicus satellite imagery. Seeking a Three.js / WebGL dev and a Python spatial data geek.',
        category: 'hackathon',
        skillsNeeded: ['Three.js', 'WebGL', 'Python', 'GIS Data', 'React'],
        teamSize: 4,
        deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: siddharthUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Campus AI Placement Prep & Mock Interview Bot',
        description:
          'Creating an open-source real-time audio/video mock interviewer trained on real campus recruitment questions. We need full-stack developers skilled in Next.js, FastAPI, and LangChain/LLMs.',
        category: 'project',
        skillsNeeded: ['Next.js', 'FastAPI', 'LangChain', 'OpenAI API', 'WebRTC'],
        teamSize: 3,
        deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: testUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Inter-College Battle of the Bands: Lead Guitarist & Drummer',
        description:
          "Our college rock band 'The Resonance' is prepping for the regional Battle of Bands. Looking for a lead guitarist comfortable with rock/fusion solos and an experienced drummer.",
        category: 'cultural',
        skillsNeeded: ['Lead Guitar', 'Percussion', 'Live Audio Mixing', 'Rock Fusion'],
        teamSize: 4,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: kabirUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Formula Student Electric: Battery Management System (BMS)',
        description:
          'Team Invictus Racing is designing the HV battery pack and custom BMS for Formula Bharat 2026. Looking for electrical and electronics engineers with MATLAB/Simulink and PCB layout skills.',
        category: 'competition',
        skillsNeeded: ['MATLAB', 'Simulink', 'Altium', 'CAN Bus', 'Embedded C'],
        teamSize: 4,
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: nehaUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Kaggle Medical Imaging Challenge: Chest X-Ray Diagnosis',
        description:
          'Forming a duo to compete in the NIH Chest X-Ray anomaly detection Kaggle benchmark. Looking for a teammate with GPU compute access and deep familiarity with PyTorch CNNs & Vision Transformers.',
        category: 'competition',
        skillsNeeded: ['PyTorch', 'Computer Vision', 'Data Augmentation', 'CUDA'],
        teamSize: 2,
        deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: devUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Campus Lost & Found Smart IoT RFID Tagging System',
        description:
          'Building physical IoT check-in stations across campus gates and library counters using RFID tags and ESP32 nodes connected via MQTT to our Campus Bond platform.',
        category: 'project',
        skillsNeeded: ['Arduino', 'ESP32', 'Node.js', 'MQTT', 'Hardware'],
        teamSize: 3,
        deadline: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: priyaUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'ACM-ICPC Regional Qualifier: Competitive Programmer Needed',
        description:
          'Aiming for ICPC Amritapuri regionals! Looking for a 3rd teammate with 1800+ rating on Codeforces or 4-star on CodeChef, skilled in Advanced Graph Algorithms and Dynamic Programming.',
        category: 'competition',
        skillsNeeded: ['Algorithms', 'Data Structures', 'C++', 'Graph Theory', 'DP'],
        teamSize: 3,
        deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: demoUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Web3 Hackathon: Decentralized Academic Credential Verifier',
        description:
          'Creating a tamper-proof degree and certificate verification protocol on Polygon for campus clubs and universities. Looking for a Solidity smart contract dev and a frontend engineer.',
        category: 'hackathon',
        skillsNeeded: ['Solidity', 'Ethers.js', 'React', 'Smart Contracts'],
        teamSize: 3,
        deadline: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: adityaUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Annual Drama Production: Stage Designers & Lighting Crew',
        description:
          'The Dramatics Society is staging an adaptation of Hamlet with modern campus context. We need creative set designers, lighting technicians, and sound mixing crew for auditorium rehearsals.',
        category: 'cultural',
        skillsNeeded: ['Stage Lighting', 'Costume Design', 'Set Construction', 'Sound Mixing'],
        teamSize: 4,
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: tanviUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Sustainable Campus: Solar-Powered Campus EV Buggy',
        description:
          'Converting an old campus utility cart into a solar-augmented electric shuttle with regenerative braking. Need mechanical and automobile engineering peers for chassis FEA and motor driver wiring.',
        category: 'project',
        skillsNeeded: ['SolidWorks', 'Power Electronics', 'Welding', 'Vehicle Dynamics'],
        teamSize: 5,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: rohanUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'CyberSecurity CTF: National Cyber Defense League Squad',
        description:
          'Assembling a 4-person squad for the upcoming Cyber Apocalypse CTF. Looking for specialists in Web Exploitation, Reverse Engineering, and Cryptography.',
        category: 'competition',
        skillsNeeded: ['Reverse Engineering', 'Binary Exploitation', 'Wireshark', 'Cryptography'],
        teamSize: 4,
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: siddharthUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Campus Food Wastage Redistribution Network & App',
        description:
          'Partnering with campus mess halls and hostel canteens to redirect surplus clean food to nearby community centers. Looking for mobile app developers and a volunteer coordinator.',
        category: 'project',
        skillsNeeded: ['React Native', 'Firebase', 'Logistics', 'UI Design'],
        teamSize: 3,
        deadline: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: tanviUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'HealthTech Hackathon: Wearable Posture & Ergonomics Monitor',
        description:
          'Building a wearable clip-on device using IMU accelerometer sensors to alert students during long coding and studying sessions about spinal posture. Looking for sensor calibration and mobile devs.',
        category: 'hackathon',
        skillsNeeded: ['IMU Sensors', 'Bluetooth LE', 'TensorFlow Lite', 'Swift'],
        teamSize: 3,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: priyaUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Campus Photography & Digital Art Exhibition Curation',
        description:
          "Organizing the annual 'Expressions' fine arts and photo gallery for the university foundation week. Need curators, visual designers for promotional booklets, and event managers.",
        category: 'cultural',
        skillsNeeded: ['Photography', 'Curating', 'Adobe Lightroom', 'Event Planning'],
        teamSize: 3,
        deadline: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: kabirUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Automated Library Book Shelving & Return Robot (AGV)',
        description:
          'Designing a mobile automated guided vehicle equipped with LiDAR SLAM and robotic gripper to sort and reshelf returned books in the central library. Looking for mechatronics enthusiasts.',
        category: 'project',
        skillsNeeded: ['SLAM', 'Computer Vision', 'LiDAR', 'Motor Drivers', 'Python'],
        teamSize: 4,
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: rohanUser._id,
        applicants: [],
        comments: [],
      },
      {
        title: 'Google Solution Challenge 2026: Disaster Co-ordination Network',
        description:
          'Developing an offline-first mesh mobile network app to coordinate medical supplies and rescue requests during regional floodings. Looking for Flutter developers and cloud architects.',
        category: 'hackathon',
        skillsNeeded: ['Flutter', 'Google Cloud', 'Maps API', 'Mesh Networking', 'System Design'],
        teamSize: 4,
        deadline: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
        status: 'open',
        createdBy: adityaUser._id,
        applicants: [],
        comments: [],
      },
    ]);
    }

    // 3. Seed Marketplace Listings
    const marketCount = await MarketItem.countDocuments();
    if (marketCount === 0) {
      console.log('🌱 Seeding marketplace items...');
      await MarketItem.create([
      {
        title: 'Apple MacBook Air M1 (8GB RAM, 256GB SSD) - Space Grey',
        description:
          'Excellent laptop for coding, web dev, and campus lectures. Battery health 91%, cycle count 180. Original 30W charger & box included.',
        price: 46500,
        category: 'electronics',
        condition: 'like-new',
        contact: '+91 98765 43210',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: demoUser._id,
      },
      {
        title: 'Lenovo ThinkPad E14 Laptop (AMD Ryzen 5, 16GB RAM, 512GB SSD)',
        description:
          'Rugged student laptop with trackpoint, backlit keyboard, FHD display. Clean Ubuntu/Windows dual boot setup for CSE labs.',
        price: 32000,
        category: 'electronics',
        condition: 'good',
        contact: '+91 91234 56789',
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: testUser._id,
      },
      {
        title: 'iPhone 13 (128GB, Midnight Black) - 5G Phone',
        description:
          'Purchased 1.5 years ago, 88% battery health. Scratchless back with Spigen case, tempered glass applied. Bill, box & cable included.',
        price: 31500,
        category: 'electronics',
        condition: 'like-new',
        contact: '+91 99887 76655',
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: devUser._id,
      },
      {
        title: 'OnePlus Nord CE 3 5G Phone (8GB RAM, 128GB Storage)',
        description:
          'Aqua Surge color, 120Hz AMOLED screen, Snapdragon 782G processor. Comes with 80W SuperVOOC fast charger and original box.',
        price: 14800,
        category: 'electronics',
        condition: 'good',
        contact: '+91 98765 43210',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: demoUser._id,
      },
      {
        title: 'Sony WH-1000XM4 Wireless Noise Cancelling Headset',
        description:
          'Over-ear premium headphones with 30hr battery life and industry-best ANC. Great for hostel study & library focus. With hard carry case.',
        price: 13500,
        category: 'electronics',
        condition: 'like-new',
        contact: '+91 91234 56789',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: devUser._id,
      },
      {
        title: 'boAt Rockerz 550 Over-Ear Wireless Headset',
        description:
          'Black color with comfortable padded earcups, 50mm dynamic drivers, deep bass, 20hr battery life. AUX cable & Type-C cord included.',
        price: 1100,
        category: 'electronics',
        condition: 'good',
        contact: '+91 98765 43210',
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: testUser._id,
      },
      {
        title: 'Apple AirPods Pro with MagSafe Wireless Charging Case',
        description:
          'Active noise cancellation and transparency mode. Clean sound, all silicone ear tips (S/M/L) included with protective silicon sleeve.',
        price: 8500,
        category: 'electronics',
        condition: 'good',
        contact: '+91 99887 76655',
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: demoUser._id,
      },
      {
        title: 'Casio fx-991EX Classwiz Scientific Calculator',
        description:
          'Original Casio scientific calculator with matrix & equation solver. Genuine solar battery cover included. Perfectly functional.',
        price: 650,
        category: 'electronics',
        condition: 'good',
        contact: '+91 91234 56789',
        image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: devUser._id,
      },
      {
        title: 'Ergonomic Aluminum Laptop Stand with 360 Rotating Base',
        description:
          'Heavy-duty foldable aluminum riser for 13-16 inch laptops. Helps improve neck posture during long coding sessions.',
        price: 550,
        category: 'electronics',
        condition: 'like-new',
        contact: '+91 99887 76655',
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: demoUser._id,
      },
      {
        title: 'Higher Engineering Mathematics by B.S. Grewal (44th Edition)',
        description:
          'Prescribed for 1st & 2nd year all branches. Very good condition, no missing pages or tears. Can hand over at central library.',
        price: 380,
        category: 'books',
        condition: 'like-new',
        contact: '+91 98765 43210',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: demoUser._id,
      },
      {
        title: 'Computer Networking: A Top-Down Approach (Kurose & Ross 7th Ed)',
        description:
          'Standard textbook for 5th sem Computer Networks. Minimal pencil underlines. Includes solved reference notes.',
        price: 420,
        category: 'books',
        condition: 'good',
        contact: '+91 99887 76655',
        image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: devUser._id,
      },
      {
        title: 'Database System Concepts (Silberschatz & Korth 6th Edition)',
        description:
          'Must-have book for DBMS and GATE prep. Hardcover edition in pristine condition. Zero markings or torn corners.',
        price: 490,
        category: 'books',
        condition: 'new',
        contact: '+91 91234 56789',
        image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: testUser._id,
      },
      {
        title: 'Handwritten Semester 4 Operating Systems & DBMS Notes',
        description:
          'Comprehensive solved question papers from past 5 years with clean diagrams and algorithms. Spiral bound.',
        price: 150,
        category: 'notes',
        condition: 'new',
        contact: '+91 99887 76655',
        image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: devUser._id,
      },
      {
        title: 'Complete DSA with C++ Handwritten Topic-wise Revision Notes',
        description:
          'Covers Trees, Graphs, DP, Heaps, and Recursion with dry-run traces and LeetCode problem patterns. 180 pages.',
        price: 180,
        category: 'notes',
        condition: 'like-new',
        contact: '+91 98765 43210',
        image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: demoUser._id,
      },
      {
        title: 'Engineering Mini Drafter + Drawing Board Sheet Holder',
        description:
          'Essential for 1st year Engineering Graphics (EG). Steel arm with smooth pivot and zero wobble. Includes protective carry pouch.',
        price: 450,
        category: 'kit',
        condition: 'good',
        contact: 'Hostel Block B, Room 302',
        image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: demoUser._id,
      },
      {
        title: 'Arduino Uno R3 Starter Kit with 30+ Sensors & Breadboard',
        description:
          'Complete robotics kit: Uno board, jumper wires, servo motor, ultrasonic sensor, LCD display, and USB cable.',
        price: 850,
        category: 'kit',
        condition: 'like-new',
        contact: '+91 91234 56789',
        image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: devUser._id,
      },
      {
        title: 'White Cotton Lab Coat (Size M) + Safety Splash Goggles',
        description:
          'Mandatory for Chemistry & Physics lab sessions. Freshly washed, stainless, double stitched with front utility pockets.',
        price: 220,
        category: 'kit',
        condition: 'good',
        contact: '+91 98765 43210',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: testUser._id,
      },
      {
        title: 'Yamaha F310 Acoustic Guitar with Padded Gig Bag & Tuner',
        description:
          '6-string natural gloss acoustic guitar with great resonance. Recently restrung with D\'Addario strings. Free picks included.',
        price: 4800,
        category: 'instruments',
        condition: 'like-new',
        contact: '+91 98765 43210',
        image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: testUser._id,
      },
      {
        title: 'Casio CT-S200 Portable Electronic Keyboard (61 Keys)',
        description:
          'Full-size 61 keys with built-in handle, dance music mode, headphone jack for quiet hostel practice. Power adapter included.',
        price: 5500,
        category: 'instruments',
        condition: 'good',
        contact: '+91 91234 56789',
        image: 'https://images.unsplash.com/photo-1520523839898-50712825e3a7?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: devUser._id,
      },
      {
        title: 'Foldable Bed Study Table with Cup Holder & Tablet Slot',
        description:
          'Sturdy wooden bed desk with rounded safety edges. Ideal for hostel late-night studying and laptop work on bed.',
        price: 350,
        category: 'furniture',
        condition: 'good',
        contact: '+91 98765 43210',
        image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: demoUser._id,
      },
      {
        title: 'Ergonomic Mid-Back Mesh Study Chair with Lumbar Support',
        description:
          'Pneumatic height adjustment, 360 swivel nylon caster wheels. Perfect for hostel or PG room setup.',
        price: 1600,
        category: 'furniture',
        condition: 'good',
        contact: 'Hostel Block C, Room 114',
        image: 'https://images.unsplash.com/photo-1580481077190-73614591e80d?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: testUser._id,
      },
      {
        title: 'Hero Sprint 26T Mountain Bicycle with Lock & Bell',
        description:
          'Single-speed campus bicycle, brand new puncture-resistant tires, front brake cables recently tuned. Great for campus commute.',
        price: 2400,
        category: 'other',
        condition: 'good',
        contact: '+91 91234 56789',
        image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: devUser._id,
      },
      {
        title: 'Yonex Carbon Graphite Badminton Racket Set with Cover',
        description:
          'Set of 2 lightweight racquets with tight BG-65 strings + 3 Yonex Mavis 350 nylon shuttles. Ideal for campus sports complex.',
        price: 750,
        category: 'other',
        condition: 'good',
        contact: '+91 99887 76655',
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        seller: demoUser._id,
      },
    ]);
    }

    // 4. Seed Lost & Found Items
    const lostCount = await LostItem.countDocuments();
    if (lostCount === 0) {
      console.log('🌱 Seeding lost & found items...');
      await LostItem.create([
      {
        type: 'lost',
        title: 'Casio fx-991 Calculator in Black Zipper Case',
        description:
          'Lost during 3rd period mid-term exam on Tuesday. Has a small yellow sticker on the back with roll number written in faint ink.',
        category: 'electronics',
        location: 'Central Library, 2nd Floor Quiet Zone',
        contact: '+91 98765 43210',
        status: 'open',
        createdBy: demoUser._id,
      },
      {
        type: 'found',
        title: 'Boat Airdopes 141 Charging Case (Black)',
        description:
          'Found on table #4 near the cafeteria counter around 4 PM. Left with the canteen supervisor or DM me to collect.',
        category: 'accessories',
        location: 'Campus Canteen / Cafeteria',
        contact: 'DM on Campus Bond or ask Canteen Counter',
        status: 'open',
        createdBy: devUser._id,
      },
      {
        type: 'found',
        title: 'Student ID Card — Dept of Mechanical Engg',
        description:
          'Found lying on the grass track near the sports pavilion. Please verify name and roll number to collect.',
        category: 'id-card',
        location: 'Sports Ground Pavilion',
        contact: 'Available at Sports Room Desk',
        status: 'open',
        createdBy: demoUser._id,
      },
    ]);
    }

    // 5. Seed Campus Clubs
    const clubCount = await Club.countDocuments();
    if (clubCount === 0) {
      console.log('🌱 Seeding campus clubs...');
      await Club.create([
      {
        name: 'Coding Club & ACM Student Chapter',
        description:
          'Official tech and coding community. Weekly coding jams, open source sprints, Hacktoberfest workshops, and competitive programming practice.',
        category: 'tech',
        createdBy: demoUser._id,
        members: [demoUser._id, devUser._id],
      },
      {
        name: 'Robotics & Automation Society (RAS)',
        description:
          'Hardware and robotics enthusiast group. We build combat bots, micro-drones, IoT sensors, and compete in Robocon.',
        category: 'tech',
        createdBy: devUser._id,
        members: [devUser._id],
      },
      {
        name: 'Cultural & Performing Arts Society',
        description:
          'Dance, theater, music, and literary arts. Organizers of the annual college fest, flash mobs, and street plays (Nukkad Natak).',
        category: 'cultural',
        createdBy: demoUser._id,
        members: [demoUser._id],
      },
      {
        name: 'E-Cell (Entrepreneurship & Innovation Cell)',
        description:
          'Incubator for student startups. Pitch competitions, investor talks, prototype grants, and networking sessions.',
        category: 'social',
        createdBy: devUser._id,
        members: [devUser._id],
      },
      {
        name: 'Sports & Athletics Council',
        description:
          'Inter-college tournaments, cricket leagues, badminton championships, football friendlies, and annual athletic meets.',
        category: 'sports',
        createdBy: demoUser._id,
        members: [demoUser._id, devUser._id],
      },
      {
        name: 'AI & Astronomy Research Society',
        description:
          'Student researchers exploring machine learning papers, astronomical observations, telescope nights, and academic publications.',
        category: 'academic',
        createdBy: devUser._id,
        members: [demoUser._id, devUser._id],
      },
      {
        name: 'Campus Photography & Media Guild',
        description:
          'Photographers, filmmakers, and digital artists. Official event coverage, photo-walks, and cinematography workshops.',
        category: 'arts',
        createdBy: demoUser._id,
        members: [demoUser._id, devUser._id],
      },
      {
        name: 'Campus Gaming & Esports League',
        description:
          'LAN gaming events, BGMI/Valorant campus scrims, game development showcases, and student tournaments.',
        category: 'other',
        createdBy: demoUser._id,
        members: [demoUser._id],
      },
    ]);
    }

    // 6. Seed sample conversations & messages for direct campus chatting
    const convoCount = await Conversation.countDocuments();
    if (convoCount === 0 && testUser && demoUser) {
      // 1. Accepted chat with Aarav Sharma
      const convo1 = await Conversation.create({
        participants: [testUser._id, demoUser._id],
        status: 'accepted',
        lastMessage: "Sounds great, thanks Aarav! Let's connect near the Central Library this Thursday.",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
      });

      await Message.create([
        {
          conversation: convo1._id,
          sender: demoUser._id,
          text: `Hey Vikash! Saw your profile on Campus Bond. Are you participating in the upcoming Smart Campus Hackathon?`,
          createdAt: new Date(Date.now() - 1000 * 60 * 120),
        },
        {
          conversation: convo1._id,
          sender: testUser._id,
          text: `Hey Aarav! Yes, definitely! I'm building a project around student collaboration and real-time campus networking.`,
          createdAt: new Date(Date.now() - 1000 * 60 * 90),
        },
        {
          conversation: convo1._id,
          sender: demoUser._id,
          text: `That's awesome! Let me know if you need any help with backend integration or system design. Looking forward to collaborating!`,
          createdAt: new Date(Date.now() - 1000 * 60 * 60),
        },
        {
          conversation: convo1._id,
          sender: testUser._id,
          text: `Sounds great, thanks Aarav! Let's connect near the Central Library this Thursday.`,
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
        },
      ]);

      // 2. Accepted chat with Ananya Gupta
      if (devUser) {
        const convo2 = await Conversation.create({
          participants: [testUser._id, devUser._id],
          status: 'accepted',
          lastMessage: 'Thanks a lot Vikash! Really appreciate your help 🙏',
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
        });

        await Message.create([
          {
            conversation: convo2._id,
            sender: devUser._id,
            text: `Hi Vikash, did you get the AI & Data Science lab assignment notes from yesterday?`,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
          },
          {
            conversation: convo2._id,
            sender: testUser._id,
            text: `Hey Ananya! Yes, I have the Jupyter notebooks and code examples saved. I'll share them with you.`,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3.5),
          },
          {
            conversation: convo2._id,
            sender: devUser._id,
            text: `Thanks a lot Vikash! Really appreciate your help 🙏`,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
          },
        ]);
      }

      // 3. Incoming Pending Request from Rohan Verma
      if (rohanUser) {
        await Conversation.create({
          participants: [testUser._id, rohanUser._id],
          status: 'pending',
          requestedBy: rohanUser._id,
          requestMessage: `Hey Vikash! We are building an automated IoT rover for the upcoming TechFest. Wanted to check if you would be interested in collaborating on the web control dashboard?`,
          lastMessage: `Chat request from Rohan: "Interested in collaborating on IoT rover dashboard?"`,
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 15),
        });
      }

      // 4. Outgoing Pending Request to Priya Singh
      if (priyaUser) {
        await Conversation.create({
          participants: [testUser._id, priyaUser._id],
          status: 'pending',
          requestedBy: testUser._id,
          requestMessage: `Hi Priya! I saw your post regarding the Embedded Systems workshop. Would love to join your study group.`,
          lastMessage: `Hi Priya! I saw your post regarding the Embedded Systems workshop.`,
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        });
      }
    }

    console.log('✅ Demo campus data seeded successfully!');
  } catch (err) {
    console.error('Error seeding demo data:', err);
  }
}
