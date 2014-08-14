#!/usr/bin/env ruby
require 'rubygems'
require 'httparty'
require 'nokogiri'
require 'open3'
require 'fileutils'
current_path=File.dirname(__FILE__)

train_new="304"
train_refresh="305"
mentor="302"
mentor_lead="303"
lane_mentor="322"

people={}
newbs,mentors,vets = [],[],[]
people[:newbs]=newbs
people[:vets]=vets
people[:mentors]=mentors


def login
  front_page=HTTParty.get('http://www.gateperimeterexodus.com/')
  @cookie=front_page.headers['set-cookie']
  doc = doc=Nokogiri::XML.parse(front_page.body)
  salt=doc.at('input[@name="hash"]')['value']
  username="quantum"
  hash="6cef29e42b681f677834350eaf6ff6cf"
  hash_password=Digest::MD5.hexdigest("fuzzbucket") + salt
  password=Digest::MD5.hexdigest(hash_password)
  sign_in=HTTParty.post('http://www.gateperimeterexodus.com/login.php',
    :body => {"password" => password,
            "username" => username,
            "hash"=>hash},
    headers:{'Cookie'=>@cookie}
  )
end

login()

users_request=HTTParty.get('http://www.gateperimeterexodus.com/request.php',headers:{'Cookie'=>@cookie},query:{action: "get",eventid:"53",object:"users"})

users=JSON.parse(users_request.body)['users']


options={
:action=>'get',
:object=>'shifts',
:days=>'08212014|08222014|08232014|08242014|08252014|08262014|08272014|08282014|08292014|08302014|08312014|09012014|09022014|09032014|09042014'}

shifts_request = HTTParty.get('http://www.gateperimeterexodus.com/request.php', headers: {'Cookie' => @cookie},query: options)
shifts=JSON.parse(shifts_request)

shifts["availshifts"].each{|k,v|
  v.each{|k,v|
    case v['roleid']
    when train_new
      newbs.push({:name=>users[v["userid"]],:id=>v['userid']})
    when mentor
      mentors.push({:name=>users[v["userid"]],:id=>v['userid']})
    when mentor_lead
      mentors.push({:name=>users[v["userid"]],:id=>v['userid']})
    when lane_mentor
      mentors.push({:name=>users[v["userid"]],:id=>v['userid']})
    when train_refresh
      vets.push({:name=>users[v["userid"]],:id=>v['userid']})
    end
  }
}
newbs.delete_if {|k| k[:name].nil? || k[:id].nil? }
mentors.delete_if {|k| k[:name].nil? || k[:id].nil? }
vets.delete_if {|k| k[:name].nil? || k[:id].nil? }

mentors.push({name:"Sailor Boy",id:"111"})
mentors.push({name:"Miss Roach",id:"45"})

newbs.uniq!
mentors.uniq!

mentors.each{|m| m["_id"]=Digest::SHA1.hexdigest(m[:name])}
newbs.each{|n| n["_id"]=Digest::SHA1.hexdigest(n[:name])}

newb_json=JSON.generate(newbs)
mentor_json=JSON.generate(mentors)

File.open(current_path+"/mentors.json", 'w') { |file|
  file.write(mentor_json)
}
File.open(current_path+"/newbs.json", 'w') { |file|
  file.write(newb_json)
}

# Runs a specified shell command in a separate thread.
# If it exceeds the given timeout in seconds, kills it.
# Returns any output produced by the command (stdout or stderr) as a String.
# Uses Kernel.select to wait up to the tick length (in seconds) between
# checks on the command's status
#
# If you've got a cleaner way of doing this, I'd be interested to see it.
# If you think you can do it with Ruby's Timeout module, think again.
def run_with_timeout(command, timeout, tick)
  output = ''
  begin
    # Start task in another thread, which spawns a process
    stdin, stderrout, thread = Open3.popen2e(command)
    # Get the pid of the spawned process
    pid = thread[:pid]
    start = Time.now

    while (Time.now - start) < timeout and thread.alive?
      # Wait up to `tick` seconds for output/error data
      Kernel.select([stderrout], nil, nil, tick)
      # Try to read the data
      begin
        output << stderrout.read_nonblock(4096)
      rescue IO::WaitReadable
        # A read would block, so loop around for another select
      rescue EOFError
        # Command has completed, not really an error...
        break
      end
    end
    # Give Ruby time to clean up the other thread
    sleep 1

    if thread.alive?
      # We need to kill the process, because killing the thread leaves
      # the process alive but detached, annoyingly enough.
      Process.kill("TERM", pid)
    end
  ensure
    stdin.close if stdin
    stderrout.close if stderrout
  end
  return output
end

run_with_timeout(current_path+"node pouch_updater.js",60,1)
FileUtils.touch('done.txt')
