# Introduction to Data Structures — Lecture 1

**Course:** CS 201 — Data Structures and Algorithms  
**Instructor:** Dr. Jane Smith  
**Week 1**

## Learning objectives

By the end of this lecture, students should be able to:

1. Define what a data structure is and why it matters
2. Compare arrays and linked lists
3. Analyze time complexity using Big-O notation

## What is a data structure?

A **data structure** is a specialized format for organizing, processing, retrieving, and storing data. Choosing the right structure affects:

- **Performance** — how fast operations run
- **Memory** — how much space is used
- **Simplicity** — how easy the code is to maintain

> **Definition:** An *abstract data type* (ADT) specifies *what* operations are supported; a data structure is *how* those operations are implemented.

## Arrays

An array stores elements in **contiguous memory**. Each element is accessed by index in **O(1)** time.

**Advantages:**
- Fast random access
- Cache-friendly memory layout

**Disadvantages:**
- Fixed size (in many languages)
- Insertion/deletion in the middle is **O(n)**

```python
# Python list as dynamic array
nums = [10, 20, 30]
nums.append(40)  # amortized O(1)
```

## Linked lists

A linked list stores elements in **nodes**, each pointing to the next.

**Advantages:**
- Dynamic size
- Insert/delete at known position in **O(1)**

**Disadvantages:**
- No random access — traversal is **O(n)**
- Extra memory for pointers

## Big-O notation

Big-O describes how runtime or space grows with input size **n**.

| Operation | Array | Linked list |
| --- | --- | --- |
| Access by index | O(1) | O(n) |
| Search | O(n) | O(n) |
| Insert at head | O(n) | O(1) |
| Insert at tail | O(1)* | O(1) |

*Amortized for dynamic arrays.

## Exercises

1. When would you prefer a linked list over an array?
2. What is the time complexity of finding the middle element of a singly linked list?

<details>
<summary>Answers</summary>

1. When you need frequent insertions/deletions at the beginning or when size varies unpredictably.
2. O(n) — you must traverse half the list.

</details>

## Further reading

- Cormen, Leiserson, Rivest, Stein — *Introduction to Algorithms*, Ch. 10
