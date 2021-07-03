"use strict";

export function clamp(num, max) { 
    return num > max ? max : num; 
}

export function sleep(delayMs) { 
    return new Promise(resolve => setTimeout(resolve, delayMs)); 
}

export function mentionToChannel(text) {
    return /^<#(\d+)>$/.test(text) ? text.match(/^<#(\d+)>$/)[1] : null;
}

export function makeSubCommands()
{
    let map = new Map();

    for (let arg of arguments)
        map.set(arg.name, arg);
    
    return map;
}
