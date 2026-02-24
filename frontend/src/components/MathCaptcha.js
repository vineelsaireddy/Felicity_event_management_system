import React, { useState, useEffect, useCallback } from 'react';

/**
 * MathCaptcha - A pure math-based CAPTCHA requiring no external API keys.
 * Generates a random arithmetic problem and validates the user's answer.
 *
 * Props:
 *   onVerified(bool) — called every time verification state changes
 */
const MathCaptcha = ({ onVerified }) => {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [operator, setOperator] = useState('+');
    const [answer, setAnswer] = useState('');
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);

    const generate = useCallback(() => {
        const ops = ['+', '-', '×'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a, b;
        if (op === '+') {
            a = Math.floor(Math.random() * 15) + 1;
            b = Math.floor(Math.random() * 15) + 1;
        } else if (op === '-') {
            a = Math.floor(Math.random() * 10) + 6;
            b = Math.floor(Math.random() * (a - 1)) + 1;
        } else {
            a = Math.floor(Math.random() * 9) + 2;
            b = Math.floor(Math.random() * 9) + 2;
        }
        setNum1(a);
        setNum2(b);
        setOperator(op);
        setAnswer('');
        setVerified(false);
        setError('');
        onVerified(false);
    }, [onVerified]);

    useEffect(() => {
        generate();
    }, [generate]);

    const correctAnswer = () => {
        if (operator === '+') return num1 + num2;
        if (operator === '-') return num1 - num2;
        return num1 * num2;
    };

    const handleCheck = () => {
        const userAns = parseInt(answer, 10);
        if (isNaN(userAns)) {
            setError('Please enter a number.');
            return;
        }
        if (userAns === correctAnswer()) {
            setVerified(true);
            setError('');
            onVerified(true);
        } else {
            setAttempts(a => a + 1);
            setError('Incorrect. Try again.');
            setAnswer('');
            if (attempts >= 2) {
                generate(); // Refresh after 3 wrong attempts
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!verified) handleCheck();
        }
    };

    return (
        <div className={`border-2 rounded-lg p-4 ${verified ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                🛡️ Bot Protection — Solve to continue
            </p>
            {verified ? (
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified — you're human!
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-gray-800 bg-white border border-gray-300 px-4 py-2 rounded-lg font-mono select-none">
                            {num1} {operator} {num2} = ?
                        </span>
                        <button
                            type="button"
                            onClick={generate}
                            title="Get a new question"
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                        >
                            🔄
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Your answer"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                            type="button"
                            onClick={handleCheck}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
                        >
                            Check
                        </button>
                    </div>
                    {error && <p className="text-red-600 text-xs font-medium">{error}</p>}
                </div>
            )}
        </div>
    );
};

export default MathCaptcha;
