#!/bin/bash
echo 'Applying security kernel update v2.4.1...'
sysctl -w net.ipv4.conf.all.rp_filter=1
echo 'Hardening complete.'
