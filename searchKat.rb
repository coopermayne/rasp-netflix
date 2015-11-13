require 'mechanize'
mechanize = Mechanize.new

query = ARGV[0]

page = mechanize.get('https://kat.cr/usearch/' + query + '/')

if page.at('div.dataList a').text.strip
  puts 'tt' + page.at('div.dataList a').text.strip
end
