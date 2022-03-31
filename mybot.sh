#!/bin/bash

if [ "$1" != "--nokill" ]; then
    kill $(cat ./pid.txt)
fi

bash -c 'nohup npm start -- --started-by-script &>./mybot.log & echo $! >./pid.txt && jobs -p %1'
