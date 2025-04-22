const readline = require('readline');

// Create interface for reading from stdin and writing to stdout
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Generate a random number between 1 and 100
const secretNumber = Math.floor(Math.random() * 100) + 1;
let attempts = 0;

console.log('Welcome to the Number Guessing Game!');
console.log('I\'m thinking of a number between 1 and 100.');

function askGuess() {
  rl.question('What is your guess? ', (answer) => {
    // Convert the answer to a number
    const guess = parseInt(answer, 10);
    attempts++;

    // Check if the input is a valid number
    if (isNaN(guess)) {
      console.log('Please enter a valid number!');
      askGuess();
      return;
    }

    // Compare the guess with the secret number
    if (guess < secretNumber) {
      console.log('Too low! Try again.');
      askGuess();
    } else if (guess > secretNumber) {
      console.log('Too high! Try again.');
      askGuess();
    } else {
      console.log(`Congratulations! You guessed the number ${secretNumber} in ${attempts} attempts!`);
      rl.close();
    }
  });
}

// Start the game
askGuess();
