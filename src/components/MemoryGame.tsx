import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Clock } from 'lucide-react';

type Card = {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const cardValues = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎶', '🎸'];

function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const initializeGame = () => {
    const shuffledCards = [...cardValues, ...cardValues]
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
      }));
    
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setTime(0);
    setIsGameActive(true);
    setGameCompleted(false);
  };

  const flipCard = (cardId: number) => {
    if (
      flippedCards.length === 2 || 
      flippedCards.includes(cardId) || 
      cards[cardId].isMatched ||
      gameCompleted
    ) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    ));

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards[firstId];
      const secondCard = cards[secondId];

      if (firstCard.value === secondCard.value) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(card =>
            card.id === firstId || card.id === secondId
              ? { ...card, isMatched: true }
              : card
          ));
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
        }, 1000);
      } else {
        // No match - flip cards back
        setTimeout(() => {
          setCards(prev => prev.map(card =>
            card.id === firstId || card.id === secondId
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (matchedPairs === cardValues.length) {
      setIsGameActive(false);
      setGameCompleted(true);
    }
  }, [matchedPairs]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGameActive && !gameCompleted) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGameActive, gameCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCardClass = (card: Card) => {
    const baseClass = "w-20 h-20 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105";
    
    if (card.isMatched) {
      return `${baseClass} bg-green-500 text-white shadow-lg`;
    } else if (card.isFlipped || flippedCards.includes(card.id)) {
      return `${baseClass} bg-white text-4xl shadow-lg`;
    } else {
      return `${baseClass} bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 shadow-lg`;
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Memory Cards</h2>
        
        {/* Game stats */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4">
          <div className="flex items-center justify-center space-x-8 text-white">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span className="text-lg font-semibold">{formatTime(time)}</span>
            </div>
            <div className="text-lg font-semibold">
              Moves: {moves}
            </div>
            <div className="text-lg font-semibold">
              Pairs: {matchedPairs}/{cardValues.length}
            </div>
          </div>
        </div>

        <button
          onClick={initializeGame}
          className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>New Game</span>
        </button>
      </div>

      {/* Game board */}
      <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl shadow-2xl">
        <div className="grid grid-cols-4 gap-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => flipCard(card.id)}
              className={getCardClass(card)}
              disabled={card.isMatched || flippedCards.length === 2}
            >
              <div className="flex items-center justify-center h-full">
                {(card.isFlipped || flippedCards.includes(card.id) || card.isMatched) 
                  ? card.value 
                  : '?'
                }
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Game completion message */}
      {gameCompleted && (
        <div className="text-center bg-green-500 text-white px-8 py-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Trophy className="w-8 h-8" />
            <h3 className="text-2xl font-bold">Congratulations!</h3>
          </div>
          <p className="text-lg">You completed the game in {moves} moves and {formatTime(time)}!</p>
        </div>
      )}

      <div className="text-white/80 text-center max-w-md">
        <p>Click on cards to flip them. Find matching pairs to complete the game. Try to finish with the fewest moves and fastest time!</p>
      </div>
    </div>
  );
}

export default MemoryGame;