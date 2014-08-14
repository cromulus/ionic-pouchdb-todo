#!/usr/bin/env ruby
require 'rubygems'
require 'httparty'
require 'nokogiri'
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

File.open("./mentors.json", 'w') { |file| file.write(mentor_json) }
File.open("./newbs.json", 'w') { |file| file.write(newb_json) }
