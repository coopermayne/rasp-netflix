require 'imdb'
require 'json'

id = ARGV[0].slice(2,7)

movie = Imdb::Movie.new(id)

cast = []
for i in (0..movie.cast_characters.length-1)
  cast << {character: movie.cast_characters[i], actor: movie.cast_members[i]}
end

title_english = movie.also_known_as.select { |item| item[:version] == 'USA' }.first
title_english = title_english && title_english[:title]

res = {
  title: movie.title,
  title_english: title_english || nil,
  cast: cast,
  directors: movie.director,
  writers: movie.writers,
  genres: movie.genres,
  plot: movie.plot,
  length: movie.length,
  poster_url: movie.poster,
  trailer_url: movie.trailer_url,
  year: movie.year,
  release_date: movie.release_date,
  languages: movie.languages,
  locations: movie.filming_locations
}

puts JSON.generate(res)
