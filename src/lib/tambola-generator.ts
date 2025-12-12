export function generateTicket() {
  const ticket: (number | null)[][] = Array(3).fill(null).map(() => Array(9).fill(null));
  const columns: number[][] = Array(9).fill(null).map(() => []);

  // Helper to get random number for a column
  const getNum = (colIndex: number) => {
    const min = colIndex * 10 + (colIndex === 0 ? 1 : 0);
    const max = colIndex * 10 + (colIndex === 8 ? 10 : 9);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Ensure each column has at least one number (simplified logic for now)
  // A proper Tambola ticket generator is complex. This is a basic placeholder.
  // Rule: 15 numbers total, 5 per row.

  // Strategy: Fill 5 random spots in each row, ensuring column constraints.
  // This is tricky to get perfect randomly.
  // Simplified approach:
  // 1. Generate 15 unique numbers distributed across columns.
  // 2. Place them in the grid.

  // Better simplified approach for prototype:
  // Just fill 5 random cells in each row with appropriate numbers.

  for (let row = 0; row < 3; row++) {
    const indices = new Set<number>();
    while (indices.size < 5) {
      indices.add(Math.floor(Math.random() * 9));
    }

    Array.from(indices).sort((a, b) => a - b).forEach(col => {
      let num = getNum(col);
      // Ensure uniqueness in column
      while (columns[col].includes(num)) {
        num = getNum(col);
      }
      columns[col].push(num);
      ticket[row][col] = num;
    });
  }

  // Sort columns (standard Tambola rule)
  for (let col = 0; col < 9; col++) {
    const nums = ticket.map(row => row[col]).filter(n => n !== null) as number[];
    nums.sort((a, b) => a - b);
    let numIdx = 0;
    for (let row = 0; row < 3; row++) {
      if (ticket[row][col] !== null) {
        ticket[row][col] = nums[numIdx++];
      }
    }
  }

  return ticket;
}
