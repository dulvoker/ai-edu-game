// Each question: { question, options: [{label, text}], correctIndex, explanation }

export const quizData = {
  bfs: {
    title: 'BFS Quiz',
    questions: [
      {
        question: 'What data structure does BFS use internally?',
        options: [
          { label: 'A', text: 'Stack' },
          { label: 'B', text: 'Queue' },
          { label: 'C', text: 'Priority Queue' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 1,
        explanation:
          'BFS uses a queue (FIFO) to explore nodes level by level.',
      },
      {
        question: 'What does BFS guarantee that DFS does not?',
        options: [
          { label: 'A', text: 'It visits every node' },
          { label: 'B', text: 'It finds the shortest path' },
          { label: 'C', text: 'It uses less memory' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 1,
        explanation:
          'BFS explores all nodes at the current depth before going deeper, guaranteeing the shortest path in an unweighted graph.',
      },
      {
        question: 'In BFS, which nodes are explored first?',
        options: [
          { label: 'A', text: 'The deepest nodes' },
          { label: 'B', text: 'Random nodes' },
          { label: 'C', text: 'The closest nodes to the start' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 2,
        explanation:
          'BFS expands the frontier level by level, always exploring the nearest nodes first.',
      },
      {
        question: 'What is the main disadvantage of BFS compared to DFS?',
        options: [
          { label: 'A', text: 'It cannot find a path' },
          { label: 'B', text: 'It uses more memory' },
          { label: 'C', text: 'It is slower on all graphs' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 1,
        explanation:
          'BFS keeps all frontier nodes in memory, which can be very large for wide graphs.',
      },
    ],
  },

  dfs: {
    title: 'DFS Quiz',
    questions: [
      {
        question: 'What data structure does DFS use internally?',
        options: [
          { label: 'A', text: 'Queue' },
          { label: 'B', text: 'Hash map' },
          { label: 'C', text: 'Stack' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 2,
        explanation:
          'DFS uses a stack (LIFO) — either explicitly or via recursion — to go as deep as possible before backtracking.',
      },
      {
        question: 'Which of these best describes DFS traversal?',
        options: [
          { label: 'A', text: 'Explores all neighbours before going deeper' },
          { label: 'B', text: 'Goes as deep as possible before backtracking' },
          { label: 'C', text: 'Always finds the shortest path' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 1,
        explanation:
          'DFS dives deep along one path until it hits a dead end, then backtracks to try another.',
      },
      {
        question: 'In which case would DFS be preferred over BFS?',
        options: [
          { label: 'A', text: 'Finding the shortest path in an unweighted graph' },
          { label: 'B', text: 'Exploring all possible paths in a maze' },
          { label: 'C', text: 'Finding the nearest neighbour' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 1,
        explanation:
          'DFS is better when you want to explore all paths or when the solution is likely deep in the tree.',
      },
      {
        question: 'What happens when DFS reaches a dead end?',
        options: [
          { label: 'A', text: 'It stops searching' },
          { label: 'B', text: 'It restarts from the beginning' },
          { label: 'C', text: 'It backtracks to the last decision point' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 2,
        explanation:
          'DFS backtracks to the most recent node that still has unexplored neighbours.',
      },
    ],
  },

  'decision-tree': {
    title: 'Decision Trees Quiz',
    questions: [
      {
        question: 'What does each internal node in a decision tree represent?',
        options: [
          { label: 'A', text: 'A final classification' },
          { label: 'B', text: 'A test on a feature' },
          { label: 'C', text: 'A training example' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 1,
        explanation:
          'Internal nodes split the data based on a feature value, guiding the classification down the tree.',
      },
      {
        question: 'What is overfitting in a decision tree?',
        options: [
          { label: 'A', text: 'The tree is too shallow' },
          { label: 'B', text: 'The tree performs well on training data but poorly on new data' },
          { label: 'C', text: 'The tree has too few nodes' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 1,
        explanation:
          'An overfitted tree memorises the training data instead of learning general patterns.',
      },
      {
        question: 'What does it mean to split a node in a decision tree?',
        options: [
          { label: 'A', text: 'To remove a branch' },
          { label: 'B', text: 'To divide the data into two groups based on a feature' },
          { label: 'C', text: 'To assign a final label' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 1,
        explanation:
          'Splitting creates two child nodes, each containing the subset of data where the feature is true or false.',
      },
      {
        question: 'Why is a smaller decision tree generally better?',
        options: [
          { label: 'A', text: 'It trains faster' },
          { label: 'B', text: 'It is easier to visualise and less likely to overfit' },
          { label: 'C', text: 'It always has higher accuracy' },
          { label: 'D', text: "Don't know" },
        ],
        correctIndex: 1,
        explanation:
          'Simpler trees generalise better to unseen data and are easier to interpret.',
      },
    ],
  },
}
