//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.3;

import "./Game.sol";


contract TicTacToe is Game {
    event Play(address player, uint256 row, uint256 col);

    uint256[][] public board; 
    // Permite realizar una jugada, indicando fila y columna
    // Las filas y columnas comienzan en 0
    // Sólo puede invocarse si el juego ya comenzó
    // Sólo puede invocarla el jugador que tiene el turno
    // Si la jugada es inválida, se rechaza con error "invalid move"
    // Debe emitir el evento Play(player, row, col) con cada jugada
    // Si un jugador gana al jugar, emite el evento Winner(winner)
    // Si no se puede jugar más es un empate y emite el evento
    // Draw(creator, challenger)
    constructor() payable {
        setInitialPlayer();
    }

    function play(uint256 row, uint256 col) public onlyRunning inTurn {
        if(row >= 3 || col >= 3) {
            revert("invalid move");
        }
        if(board[row][col] != 0) {
            revert("invalid move");
        }
        
        board[row][col] = playerIndex(msg.sender) + 1;
        if (checkWin(playerIndex(msg.sender)+1)) {
            winner = players[next];
            winnings[next] = 2 * bet;
            emit Winner(msg.sender);
            _endGame();
            claimWinnings();
        } else if (checkDraw()) {
            emit Draw(players[0], players[1]);
            winnings[0] = bet;
            winnings[1] = bet;
            _endGame();
        } else {
            changeTurn();
        }
        emit Play(msg.sender, row, col);
    }
    function checkWin(uint256 player) internal view returns (bool) {
        for (uint256 i = 0; i < 3; i++) {
            if (board[i][0] == player && board[i][1] == player && board[i][2] == player) {
                return true;
            }
            if (board[0][i] == player && board[1][i] == player && board[2][i] == player) {
                return true;
            }
        }
        if (board[0][0] == player && board[1][1] == player && board[2][2] == player) {
            return true;
        }
        if (board[0][2] == player && board[1][1] == player && board[2][0] == player) {
            return true;
        }
        return false;
    }
    function checkDraw() internal view returns (bool) {
        for (uint256 i = 0; i < 3; i++) {
            for (uint256 j = 0; j < 3; j++) {
                if (board[i][j] == 0) {
                    return false;
                }
            }
        }
        return true;
    }
    function _endGame() internal {
        status = Status.Ended;
        kill();

    }
}

