let score = JSON.parse(localStorage.getItem('score')) || {
  wins: 0,
  losses: 0,
  ties: 0
};

updateScoreElement();



document.querySelector('.js-rock-button')
  .addEventListener('click', () => {
    playGame('rock');
  });

document.querySelector('.js-paper-button')
  .addEventListener('click', () => {
    playGame('paper');
  });

document.querySelector('.js-scissors-button')
  .addEventListener('click', () => {
    playGame('scissors');
  });

  /*
  Add an event listener
  if the user presses the key r => play rock
  if the user presses the key p => play paper
  if the user presses the key s => play scissors
  */


// ===================================================================================================== adding keyboard event listener
// The function to be executed by both click and keyboard event
function performAction(key) {
  if (key === 'r') {
    playGame('rock');
  } else if (key === 'p') {
    playGame('paper');
  } else if (key === 's') {
    playGame('scissors');
  }
}

// 1. Add a keyboard event listener to the document
document.addEventListener('keydown', function(event) {
  if (event.key === 'r' || event.key === 'p' || event.key === 's') {
    performAction(event.key);
  }
});



//=====================================================================================================implmeted playgame function
function playGame(playerMove) {
  const computerMove = pickComputerMove();

  let result = '';
    // calculate result
  // update the score and store it using localStorage.setItem
  // show the new score and the updated images using "document.querySelector"
  
  // playerMove: rocks
  if (playerMove === 'rock'){
    if (computerMove === 'rock') {
      result = 'Tie.';
      score.ties += 1;
    } else if (computerMove === 'paper') {
      result = 'You lose.';
      score.losses += 1;
    } else if (computerMove === 'scissors') {
      result = 'You win.';
      score.wins += 1;
    }
  }
  // playerMove: scissors
  if (playerMove === 'scissors'){
    if (computerMove === 'rock') {
      result = 'You lose.';
      score.losses += 1;
    } else if (computerMove === 'paper') {
      result = 'You win.';
      score.wins += 1;
    } else if (computerMove === 'scissors') {
      result = 'Tie.';
      score.ties += 1;
    }
  }
  // playerMove: paper
  if (playerMove === 'paper'){
    if (computerMove === 'rock') {
      result = 'You win.';
      score.wins += 1;
    } else if (computerMove === 'paper') {
      result = 'Tie.';
      score.ties += 1;
    } else if (computerMove === 'scissors') {
      result = 'You lose.';
      score.losses += 1;
    }
  }
  // updating the score
  updateScoreElement();
  // savving the score to localStorage
  localStorage.setItem('score', JSON.stringify(score));
  // printing the result
  document.querySelector('.js-result') .innerHTML = result;

  // document.querySelector('.js-moves') .innerHTML = `You picked ${playerMove},  computer picked ${computerMove}.`;
  
  document.querySelector('.js-moves') .innerHTML = `You picked ${playerMove},    
  <button class="move-button js-rock-button">
      <img src="images/${playerMove}-emoji.png" class="move-icon" />
    </button>

    <button class="move-button js-scissors-button">
      <img src="images/${computerMove}-emoji.png" class="move-icon" />
    </button>
    
    computer picked ${computerMove}.`;
  
}

function updateScoreElement() {
  document.querySelector('.js-score')
    .innerHTML = `Wins: ${score.wins}, Losses: ${score.losses}, Ties: ${score.ties}`;
}

function pickComputerMove() {
  const randomNumber = Math.random();

  let computerMove = '';

  if (randomNumber >= 0 && randomNumber < 1 / 3) {
    computerMove = 'rock';
  } else if (randomNumber >= 1 / 3 && randomNumber < 2 / 3) {
    computerMove = 'paper';
  } else if (randomNumber >= 2 / 3 && randomNumber < 1) {
    computerMove = 'scissors';
  }

  return computerMove;
}