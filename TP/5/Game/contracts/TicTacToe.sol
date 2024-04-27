//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.3;

import "./Game.sol";


contract TicTacToe is Game {
    event Play(address player, uint256 row, uint256 col);

    // Permite realizar una jugada, indicando fila y columna
    // Las filas y columnas comienzan en 0
    // Sólo puede invocarse si el juego ya comenzó
    // Sólo puede invocarla el jugador que tiene el turno
    // Si la jugada es inválida, se rechaza con error "invalid move"
    // Debe emitir el evento Play(player, row, col) con cada jugada
    // Si un jugador gana al jugar, emite el evento Winner(winner)
    // Si no se puede jugar más es un empate y emite el evento
    // Draw(creator, challenger)
    function play(uint256 row, uint256 col) public onlyRunning inTurn {}
}

