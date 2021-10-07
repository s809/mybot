#!/bin/bash

if [ "$1" != "--nokill" ]; then
    kill $(cat ./pid.txt)
fi

bash -c 'nohup node main.js --started-by-script &>./mybot.log & echo $! >./pid.txt && jobs -p %1'
