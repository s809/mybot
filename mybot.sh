#!/bin/bash

kill -INT $(cat ./pid.txt)
bash -c 'nohup node main.js &>./mybot.log & echo $! >./pid.txt && jobs -p %1'