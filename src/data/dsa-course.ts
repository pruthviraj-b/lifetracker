export const DSACourseData = {
    habit: {
        title: "DSA Mastery: The Coding Interview",
        category: "learning",
        timeOfDay: "anytime",
        frequency: [0, 1, 2, 3, 4, 5, 6],
        type: "goal",
        goalDuration: 90,
        goalProgress: 0,
        streak: 0,
        archived: false,
        priority: "high"
    },
    note: {
        title: "💻 DSA: Zero to FAANG",
        content: `# DSA Mastery: The Coding Interview

**Goal**: Crack coding interviews at top tech companies.
**Focus**: Problem Solving, Patterns, and Algorithmic Thinking.

---

## 🏗️ Module 1: Foundations & Arrays (Days 1-14)

### Day 1: Big O Analysis
**Objective**: Understand how to measure algorithm efficiency.

**Time Complexity**:
- **O(1)**: Constant time (Hash Map lookup)
- **O(n)**: Linear time (Looping through array)
- **O(log n)**: Logarithmic time (Binary Search)
- **O(n^2)**: Quadratic time (Nested loops)

**Space Complexity**:
- How much memory does your algorithm use?

\`\`\`java
// O(n) example
for (int i = 0; i < n; i++) {
    System.out.println(i);
}
\`\`\`

### Day 2: Array Operations
**Objective**: Mastering static and dynamic arrays.

- Insertion: O(n) in worst case (shifting elements)
- Deletion: O(n)
- Access: O(1)

**Key Problems**:
1. Reverse an Array
2. Find Min/Max element
3. Remove Duplicates

### Day 3: Two Pointers Technique
**Objective**: Solving array problems efficiently.

Used for sorted arrays or reversing logic.
**Example**: Check if array is palindrome.

\`\`\`python
def is_palindrome(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        if arr[left] != arr[right]:
            return False
        left += 1
        right -= 1
    return True
\`\`\`

### Day 4: Sliding Window
**Objective**: Optimization technique for subarrays.

Used for finding subarrays with specific properties (e.g., Max Sum Subarray of size K).

### Day 5: Prefix Sum
**Objective**: Range query optimization.

Pre-calculating sums to answer range sum queries in O(1).

---

## 📚 Module 2: Hashing & Strings (Days 15-25)

### Day 15: Hash Maps (Dictionaries)
**Objective**: O(1) Lookups.

Understanding collisions, load factor, and implementation.

**Problem**: Two Sum
Given an array of integers, return indices of the two numbers such that they add up to a specific target.

\`\`\`python
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
\`\`\`

### Day 16: String Manipulations
**Objective**: Anagrams, Palindromes, and Substrings.

---

## ⛓️ Module 3: Linked Lists (Days 26-35)

### Day 26: Singly Linked Lists
**Objective**: Node-based data structures.

- Insert Head/Tail
- Delete Node
- Reverse List

### Day 27: Fast & Slow Pointers
**Objective**: Cycle detection.

**Floyd's Tortoise and Hare Algorithm** to detect cycles in a linked list.

---

## 🌲 Module 4: Trees & Graphs (Days 36-60)

### Day 36: Binary Trees
**Objective**: Hierarchical data.

- Pre-order, In-order, Post-order traversal.
- Max Depth, Diameter.

### Day 37: Binary Search Trees (BST)
**Objective**: Sorted trees for fast lookup O(log n).

### Day 45: Graphs & BFS/DFS
**Objective**: Network data structures.

- **BFS**: Level order traversal (Queue).
- **DFS**: Depth first traversal (Stack/Recursion).

---

## ⚡ Module 5: Dynamic Programming (Days 61-90)

### Day 61: Memoization & Tabulation
**Objective**: Optimizing recursion.

**Fibonacci Sequence**:
\`\`\`python
memo = {}
def fib(n):
    if n in memo: return memo[n]
    if n <= 1: return n
    memo[n] = fib(n-1) + fib(n-2)
    return memo[n]
\`\`\`

### Day 62: Knapsack Problem
**Objective**: The classic optimization problem.

---

## 🏆 Top Resources
1. **[LeetCode](https://leetcode.com/)** - The platform for practice.
2. **[NeetCode.io](https://neetcode.io/)** - Structured roadmap.
3. **[GeeksforGeeks](https://www.geeksforgeeks.org/)** - Documentation.
`,
        category: "learning",
        color: "#10b981", // Green
        isPinned: true,
        type: "standalone"
    }
};
