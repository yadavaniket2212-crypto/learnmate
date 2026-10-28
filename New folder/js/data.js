/**
 * LearnMate AI - Initial Seed Data & Question Bank
 * Provides sample data for first-time loads: syllabus topics, quiz questions, rewards, and user profile.
 */

// Global Safe HTML Escaper
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
window.escapeHtml = escapeHtml;

const DEFAULT_PROFILE = {
    name: "Alex Rivera",
    grade: "Grade 11 • STEM Track",
    title: "Locked In Scholar 🧠",
    avatar: "🎓",
    points: 420, // Aura points
    streak: 4,
    level: 4,
    totalQuizzesTaken: 6,
    totalQuestionsAnswered: 30,
    correctAnswers: 22,
    weeklyStudyGoalHours: 12,
    weeklyStudyDoneHours: 7.5,
    redeemedCoupons: [
        {
            id: "cpn-init-1",
            title: "1-Hour Gaming Lounge Pass",
            code: "LM-GAME-7721",
            cost: 300,
            date: "Yesterday",
            expires: "In 6 days",
            icon: "🎮"
        }
    ]
};

const DEFAULT_SYLLABUS = [
    // Mathematics
    {
        id: "syl-1",
        subject: "Mathematics",
        topic: "Quadratic Equations & Parabolas",
        estimatedHours: 4,
        difficulty: "Medium",
        status: "completed", // 'pending' | 'in-progress' | 'completed'
        notes: "Factoring, vertex form, quadratic formula mastered."
    },
    {
        id: "syl-2",
        subject: "Mathematics",
        topic: "Calculus: Limits & Continuity",
        estimatedHours: 6,
        difficulty: "Hard",
        status: "in-progress",
        notes: "Need to review epsilon-delta definition and indeterminate forms."
    },
    {
        id: "syl-3",
        subject: "Mathematics",
        topic: "Trigonometric Identities & Graphs",
        estimatedHours: 5,
        difficulty: "Hard",
        status: "pending",
        notes: "Double angle and half angle formula practice required."
    },
    {
        id: "syl-4",
        subject: "Mathematics",
        topic: "Probability & Combinatorics",
        estimatedHours: 3.5,
        difficulty: "Medium",
        status: "pending",
        notes: "Permutations vs combinations word problems."
    },

    // Physics
    {
        id: "syl-5",
        subject: "Physics",
        topic: "Newton's Laws of Motion & Friction",
        estimatedHours: 4,
        difficulty: "Medium",
        status: "completed",
        notes: "Free body diagrams and inclined plane problems completed."
    },
    {
        id: "syl-6",
        subject: "Physics",
        topic: "Electromagnetism & Faraday's Law",
        estimatedHours: 6,
        difficulty: "Hard",
        status: "in-progress",
        notes: "Right hand rules and magnetic flux calculations."
    },
    {
        id: "syl-7",
        subject: "Physics",
        topic: "Wave Optics & Interference",
        estimatedHours: 4,
        difficulty: "Hard",
        status: "pending",
        notes: "Young's double slit experiment derivations."
    },
    {
        id: "syl-8",
        subject: "Physics",
        topic: "Thermodynamics & Heat Engines",
        estimatedHours: 3,
        difficulty: "Medium",
        status: "pending",
        notes: "Carnot cycle efficiency and entropy."
    },

    // Biology
    {
        id: "syl-9",
        subject: "Biology",
        topic: "Cell Structure & Organelles",
        estimatedHours: 3,
        difficulty: "Easy",
        status: "completed",
        notes: "Mitochondria, nucleus, endoplasmic reticulum functions."
    },
    {
        id: "syl-10",
        subject: "Biology",
        topic: "Photosynthesis: Light & Dark Reactions",
        estimatedHours: 5,
        difficulty: "Hard",
        status: "in-progress",
        notes: "Calvin cycle steps and ATP synthesis need clarification."
    },
    {
        id: "syl-11",
        subject: "Biology",
        topic: "Genetics: Mendelian Inheritance & Punnett Squares",
        estimatedHours: 4,
        difficulty: "Medium",
        status: "pending",
        notes: "Dihybrid crosses and sex-linked traits."
    },

    // Computer Science
    {
        id: "syl-12",
        subject: "Computer Science",
        topic: "Arrays, Linked Lists & Complexity (Big-O)",
        estimatedHours: 4,
        difficulty: "Medium",
        status: "completed",
        notes: "Time and space complexity for core array operations."
    },
    {
        id: "syl-13",
        subject: "Computer Science",
        topic: "Binary Search Trees & Traversal",
        estimatedHours: 5,
        difficulty: "Hard",
        status: "in-progress",
        notes: "In-order, pre-order, post-order recursive algorithms."
    },
    {
        id: "syl-14",
        subject: "Computer Science",
        topic: "Recursion & Dynamic Programming Basics",
        estimatedHours: 6,
        difficulty: "Hard",
        status: "pending",
        notes: "Memoization patterns and base cases."
    }
];

const INITIAL_QUIZ_HISTORY = [
    {
        id: "hist-1",
        quizTitle: "Biology: Cellular Energy & Reactions",
        subject: "Biology",
        timestamp: "2026-10-26T14:30:00Z",
        score: 2,
        totalQuestions: 5,
        percentage: 40,
        weakTopics: ["Photosynthesis: Light & Dark Reactions"],
        answers: [
            { topic: "Photosynthesis: Light & Dark Reactions", correct: false, question: "Where does the Calvin cycle take place in chloroplasts?" },
            { topic: "Photosynthesis: Light & Dark Reactions", correct: false, question: "What is the primary role of chlorophyll during light reactions?" },
            { topic: "Cell Structure & Organelles", correct: true, question: "Which organelle generates ATP via cellular respiration?" },
            { topic: "Photosynthesis: Light & Dark Reactions", correct: false, question: "What molecule fixes CO2 in the first step of the Calvin cycle?" },
            { topic: "Cell Structure & Organelles", correct: true, question: "What is the semi-permeable boundary of animal cells?" }
        ]
    },
    {
        id: "hist-2",
        quizTitle: "Physics: Forces & Electromagnetism",
        subject: "Physics",
        timestamp: "2026-10-27T10:15:00Z",
        score: 3,
        totalQuestions: 5,
        percentage: 60,
        weakTopics: ["Electromagnetism & Faraday's Law"],
        answers: [
            { topic: "Newton's Laws of Motion & Friction", correct: true, question: "What happens when net external force is zero?" },
            { topic: "Electromagnetism & Faraday's Law", correct: false, question: "According to Lenz's law, what does an induced magnetic field oppose?" },
            { topic: "Newton's Laws of Motion & Friction", correct: true, question: "What is the relationship between force, mass, and acceleration?" },
            { topic: "Electromagnetism & Faraday's Law", correct: false, question: "What unit measures magnetic flux?" },
            { topic: "Newton's Laws of Motion & Friction", correct: true, question: "Which force opposes relative sliding between two surfaces?" }
        ]
    }
];

const QUESTION_BANK = [
    // BIOLOGY - Photosynthesis
    {
        id: "bio-1",
        subject: "Biology",
        topic: "Photosynthesis: Light & Dark Reactions",
        difficulty: "Medium",
        question: "Where do the light-dependent reactions of photosynthesis take place inside a plant cell?",
        options: [
            "Stroma of the chloroplast",
            "Thylakoid membranes",
            "Mitochondrial matrix",
            "Cytoplasm"
        ],
        correctIndex: 1,
        explanation: "Light-dependent reactions occur across the thylakoid membranes where chlorophyll pigments absorb light photons to produce ATP and NADPH."
    },
    {
        id: "bio-2",
        subject: "Biology",
        topic: "Photosynthesis: Light & Dark Reactions",
        difficulty: "Hard",
        question: "What enzyme catalyzes the carbon fixation reaction in the Calvin cycle?",
        options: [
            "ATP Synthase",
            "RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase)",
            "DNA Polymerase",
            "Amylase"
        ],
        correctIndex: 1,
        explanation: "RuBisCO is the critical enzyme that attaches atmospheric CO2 to a 5-carbon sugar (RuBP) during the dark reactions."
    },
    {
        id: "bio-3",
        subject: "Biology",
        topic: "Photosynthesis: Light & Dark Reactions",
        difficulty: "Medium",
        question: "What is the primary source of electrons that replenish Photosystem II during photosynthesis?",
        options: [
            "Water molecules (photolysis)",
            "Carbon dioxide",
            "Glucose molecules",
            "Oxygen atoms"
        ],
        correctIndex: 0,
        explanation: "Enzymes in Photosystem II split water molecules into protons, electrons, and oxygen gas. This water photolysis supplies fresh electrons."
    },
    {
        id: "bio-4",
        subject: "Biology",
        topic: "Cell Structure & Organelles",
        difficulty: "Easy",
        question: "Which cell organelle is known as the 'powerhouse' because it produces the cell's ATP?",
        options: [
            "Ribosome",
            "Golgi Apparatus",
            "Mitochondrion",
            "Lysosome"
        ],
        correctIndex: 2,
        explanation: "Mitochondria convert nutrients into adenosine triphosphate (ATP) through cellular respiration."
    },
    {
        id: "bio-5",
        subject: "Biology",
        topic: "Genetics: Mendelian Inheritance & Punnett Squares",
        difficulty: "Medium",
        question: "If two heterozygous pea plants (Bb) are crossed, what is the expected phenotypic ratio for a dominant trait?",
        options: [
            "1:1",
            "3:1 (Dominant to Recessive)",
            "1:2:1",
            "4:0"
        ],
        correctIndex: 1,
        explanation: "Punnett square gives BB (1), Bb (2), bb (1). Three have at least one dominant B allele (dominant phenotype) and one is homozygous recessive bb (3:1 ratio)."
    },

    // PHYSICS - Electromagnetism & Mechanics
    {
        id: "phy-1",
        subject: "Physics",
        topic: "Electromagnetism & Faraday's Law",
        difficulty: "Medium",
        question: "According to Faraday's Law, what induces an electromotive force (EMF) in a closed circuit loop?",
        options: [
            "A constant static electric field",
            "A change in magnetic flux through the loop over time",
            "A constant uniform magnetic field",
            "Zero resistance in the wire"
        ],
        correctIndex: 1,
        explanation: "Faraday's Law states EMF = -d(Phi_B)/dt; an EMF is induced only when the magnetic flux passing through the loop changes."
    },
    {
        id: "phy-2",
        subject: "Physics",
        topic: "Electromagnetism & Faraday's Law",
        difficulty: "Hard",
        question: "What does Lenz's Law describe regarding the direction of an induced current?",
        options: [
            "It always flows clockwise",
            "It flows in such a direction that its magnetic field opposes the change in flux that caused it",
            "It amplifies the original magnetic field indefinitely",
            "It flows in the exact same direction as the original current"
        ],
        correctIndex: 1,
        explanation: "Lenz's Law is a consequence of conservation of energy: the induced current produces a magnetic field that opposes the change in flux."
    },
    {
        id: "phy-3",
        subject: "Physics",
        topic: "Electromagnetism & Faraday's Law",
        difficulty: "Medium",
        question: "What is the SI unit of magnetic flux?",
        options: [
            "Tesla (T)",
            "Weber (Wb)",
            "Henry (H)",
            "Coulomb (C)"
        ],
        correctIndex: 1,
        explanation: "Weber (Wb) is the SI unit of magnetic flux (1 Wb = 1 Tesla * meter^2). Tesla measures magnetic flux density."
    },
    {
        id: "phy-4",
        subject: "Physics",
        topic: "Newton's Laws of Motion & Friction",
        difficulty: "Easy",
        question: "A hockey puck slides on frictionless ice. If no net force acts on it, what will it do?",
        options: [
            "Slow down and stop immediately",
            "Continue moving with constant velocity indefinitely",
            "Gradually accelerate forward",
            "Curve in a circular path"
        ],
        correctIndex: 1,
        explanation: "Newton's First Law (Law of Inertia) states an object in motion remains in motion with constant velocity unless acted upon by a net external force."
    },
    {
        id: "phy-5",
        subject: "Physics",
        topic: "Wave Optics & Interference",
        difficulty: "Hard",
        question: "In Young's Double Slit Experiment, what condition causes a bright fringe (constructive interference)?",
        options: [
            "Path difference is an odd multiple of half-wavelengths: (m + 0.5) * lambda",
            "Path difference is an integer multiple of wavelengths: m * lambda",
            "Slit width is zero",
            "Light frequency is reduced to zero"
        ],
        correctIndex: 1,
        explanation: "Constructive interference occurs when wave crests align, which happens when the path difference is an integer multiple of the wavelength (d * sin(theta) = m * lambda)."
    },

    // MATHEMATICS - Calculus & Algebra
    {
        id: "math-1",
        subject: "Mathematics",
        topic: "Calculus: Limits & Continuity",
        difficulty: "Medium",
        question: "What is the value of the limit: lim (x -> 0) of (sin(x) / x)?",
        options: [
            "0",
            "1",
            "Infinity",
            "Undefined"
        ],
        correctIndex: 1,
        explanation: "This fundamental trigonometric limit evaluates to 1, provable via the Squeeze Theorem or L'Hopital's Rule (cos(0)/1 = 1)."
    },
    {
        id: "math-2",
        subject: "Mathematics",
        topic: "Calculus: Limits & Continuity",
        difficulty: "Hard",
        question: "If a function f(x) is continuous at x = c, which condition must hold true?",
        options: [
            "f(c) exists, lim(x->c) f(x) exists, and lim(x->c) f(x) = f(c)",
            "The derivative f'(c) must exist and be positive",
            "f(c) must equal zero",
            "The limit from the left must be strictly greater than from the right"
        ],
        correctIndex: 0,
        explanation: "Formal continuity at x = c requires: 1) f(c) is defined, 2) two-sided limit exists, and 3) the limit equals the function value."
    },
    {
        id: "math-3",
        subject: "Mathematics",
        topic: "Quadratic Equations & Parabolas",
        difficulty: "Easy",
        question: "What does the discriminant (b^2 - 4ac) of a quadratic equation ax^2 + bx + c = 0 tell us when it is strictly negative (< 0)?",
        options: [
            "Two distinct real roots exist",
            "Exactly one real repeated root exists",
            "No real roots exist (two complex conjugate roots)",
            "The parabola must pass through the origin"
        ],
        correctIndex: 2,
        explanation: "When b^2 - 4ac < 0, the square root produces an imaginary number, meaning the parabola has no real x-intercepts."
    },
    {
        id: "math-4",
        subject: "Mathematics",
        topic: "Trigonometric Identities & Graphs",
        difficulty: "Medium",
        question: "Which of the following expressions is equivalent to sin(2x)?",
        options: [
            "2 * sin(x) * cos(x)",
            "cos^2(x) - sin^2(x)",
            "sin^2(x) + cos^2(x)",
            "2 * tan(x)"
        ],
        correctIndex: 0,
        explanation: "The double-angle formula for sine is sin(2x) = 2*sin(x)*cos(x)."
    },
    {
        id: "math-5",
        subject: "Mathematics",
        topic: "Probability & Combinatorics",
        difficulty: "Medium",
        question: "In how many ways can a committee of 3 students be chosen from a group of 7 students?",
        options: [
            "21",
            "35",
            "210",
            "42"
        ],
        correctIndex: 1,
        explanation: "Combination formula: C(7, 3) = 7! / (3! * 4!) = (7 * 6 * 5) / (3 * 2 * 1) = 35."
    },

    // COMPUTER SCIENCE - Data Structures & Algorithms
    {
        id: "cs-1",
        subject: "Computer Science",
        topic: "Binary Search Trees & Traversal",
        difficulty: "Medium",
        question: "Which tree traversal order visits nodes of a Binary Search Tree (BST) in ascending numerical order?",
        options: [
            "Pre-order (Root, Left, Right)",
            "In-order (Left, Root, Right)",
            "Post-order (Left, Right, Root)",
            "Level-order (Breadth-first)"
        ],
        correctIndex: 1,
        explanation: "In-order traversal visits all smaller elements in the left subtree, then the root, then the right subtree, producing an ascending sorted sequence."
    },
    {
        id: "cs-2",
        subject: "Computer Science",
        topic: "Binary Search Trees & Traversal",
        difficulty: "Hard",
        question: "What is the worst-case search time complexity for a skewed Binary Search Tree with N nodes?",
        options: [
            "O(1)",
            "O(log N)",
            "O(N)",
            "O(N^2)"
        ],
        correctIndex: 2,
        explanation: "When elements are inserted in already-sorted order without balancing (like an AVL or Red-Black tree), the BST degenerates into a linear linked list with O(N) lookup time."
    },
    {
        id: "cs-3",
        subject: "Computer Science",
        topic: "Arrays, Linked Lists & Complexity (Big-O)",
        difficulty: "Easy",
        question: "What is the average time complexity to access an element by index in an array?",
        options: [
            "O(1) - Constant time",
            "O(log N) - Logarithmic",
            "O(N) - Linear time",
            "O(N log N)"
        ],
        correctIndex: 0,
        explanation: "Arrays store elements in contiguous memory slots, allowing instant O(1) random access via memory address offsets."
    },
    {
        id: "cs-4",
        subject: "Computer Science",
        topic: "Recursion & Dynamic Programming Basics",
        difficulty: "Hard",
        question: "What core technique distinguishes Dynamic Programming from naive recursion?",
        options: [
            "Eliminating all loops from the code",
            "Storing solutions to overlapping subproblems (memoization or tabulation) to avoid redundant computation",
            "Using binary search instead of linear search",
            "Converting all integers to floating point numbers"
        ],
        correctIndex: 1,
        explanation: "Dynamic programming caches the results of overlapping subproblems, reducing exponential time complexities (like O(2^N) Fibonacci) to linear O(N) time."
    }
];

const REWARDS_CATALOG = [
    {
        id: "rew-1",
        title: "Midnight Pizza Slice Run",
        category: "Brain Fuel",
        cost: 250,
        icon: "🍕",
        description: "No cap, free hot pizza slice + beverage voucher at campus partner parlor.",
        popular: true
    },
    {
        id: "rew-2",
        title: "Iced Brown Sugar Boba / Cold Brew",
        category: "Brain Fuel",
        cost: 160,
        icon: "🧋",
        description: "Recharge your late night study grind with a free iced boba or craft cold brew.",
        popular: true
    },
    {
        id: "rew-3",
        title: "Certified Touch Grass Pass (1-Hr Break)",
        category: "Mental Health",
        cost: 100,
        icon: "🌿",
        description: "Official permission slip to close your laptop, stretch, and soak in sunshine.",
        popular: false
    },
    {
        id: "rew-4",
        title: "1-Hour Gaming Lounge Pass",
        category: "Entertainment",
        cost: 300,
        icon: "🎮",
        description: "Free 60-min PC / Console lounge pass at the campus recreation center.",
        popular: true
    },
    {
        id: "rew-5",
        title: "Aesthetic Stationery & Bookstore Voucher",
        category: "Study Gear",
        cost: 380,
        icon: "📚",
        description: "20% off aesthetic pastel highlighters, grid notebooks, and study essentials.",
        popular: false
    },
    {
        id: "rew-6",
        title: "1-Month Spotify / Lo-Fi Study Pass",
        category: "Digital Perks",
        cost: 500,
        icon: "🎧",
        description: "Ad-free tunes to keep you locked in the deep work flow state.",
        popular: false
    },
    {
        id: "rew-7",
        title: "Main Character Aura Badge",
        category: "Aura & Clout",
        cost: 750,
        icon: "👑",
        description: "Mythic glowing profile badge celebrating unstoppable study consistency.",
        popular: false
    }
];
