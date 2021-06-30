"use strict";

module.exports = {
    clamp: (num, max) => num > max ? max : num,

    mentionToChannel: text => {
        return /^<#(\d+)>$/.test(text) ? text.match(/^<#(\d+)>$/)[1] : null;
    }
}
