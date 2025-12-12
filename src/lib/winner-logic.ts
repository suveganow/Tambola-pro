export type TicketNumbers = (number | null)[][];

export const checkEarlyFive = (ticket: TicketNumbers, calledNumbers: number[]): boolean => {
  let count = 0;
  for (let row of ticket) {
    for (let num of row) {
      if (num !== null && calledNumbers.includes(num)) {
        count++;
      }
    }
  }
  return count >= 5;
};

export const checkTopLine = (ticket: TicketNumbers, calledNumbers: number[]): boolean => {
  const row = ticket[0];
  for (let num of row) {
    if (num !== null && !calledNumbers.includes(num)) {
      return false;
    }
  }
  return true;
};

export const checkMiddleLine = (ticket: TicketNumbers, calledNumbers: number[]): boolean => {
  const row = ticket[1];
  for (let num of row) {
    if (num !== null && !calledNumbers.includes(num)) {
      return false;
    }
  }
  return true;
};

export const checkBottomLine = (ticket: TicketNumbers, calledNumbers: number[]): boolean => {
  const row = ticket[2];
  for (let num of row) {
    if (num !== null && !calledNumbers.includes(num)) {
      return false;
    }
  }
  return true;
};

export const checkFullHouse = (ticket: TicketNumbers, calledNumbers: number[]): boolean => {
  for (let row of ticket) {
    for (let num of row) {
      if (num !== null && !calledNumbers.includes(num)) {
        return false;
      }
    }
  }
  return true;
};

export const checkCorners = (ticket: TicketNumbers, calledNumbers: number[]): boolean => {
  const corners = [
    ticket[0][0], // Top Left (might be null, need to find first number)
    ticket[0][8], // Top Right
    ticket[2][0], // Bottom Left
    ticket[2][8]  // Bottom Right
  ];

  // Real Tambola corners are the first and last numbers of top and bottom rows.
  // Simplified for now: specific indices if not null. 
  // Better logic: Find first and last non-null of top and bottom rows.

  const getRowCorners = (rowIndex: number) => {
    const row = ticket[rowIndex];
    const first = row.find(n => n !== null);
    const last = [...row].reverse().find(n => n !== null);
    return [first, last];
  };

  const topCorners = getRowCorners(0);
  const bottomCorners = getRowCorners(2);
  const allCorners = [...topCorners, ...bottomCorners];

  for (let num of allCorners) {
    if (num !== undefined && num !== null && !calledNumbers.includes(num)) {
      return false;
    }
  }
  return true;
};
