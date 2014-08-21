#!/usr/bin/env bash

# load rvm ruby
source /usr/local/rvm/environments/ruby-2.1.0@global
cd /home/cromie/burningman_gate_mentor
bundle install
bundle exec GASMS_parser.rb
