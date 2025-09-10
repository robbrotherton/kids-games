library(jsonlite)
library(hunspell)

# Read the word list (one word per line)
words <- readLines("wordle/google-10000-english-usa-no-swears.txt")
words <- trimws(words)
words <- words[words != ""]

# Filter to only words recognized by hunspell
is_real_word <- hunspell_check(words)
words <- words[is_real_word]

# List of common exceptions (not plurals)
exceptions <- c(
  "bus", "gas", "kiss", "glass", "class", "grass", "bias", "boss", "pass", "cross", "dress", "press", "loss", "mess", "less", "guess", "stress", "chess", "process", "access", "basis", "crisis", "thesis", "analysis", "species", "series", "news",
  "atlas", "alias", "canvas", "circus", "compass", "consensus", "corpus", "cypress", "genius", "iris", "lens", "minus", "octopus", "plus", "status", "virus", "bonus", "campus", "focus", "fungus", "hippopotamus", "jealous", "lettuce", "lotus", "nexus", "opus", "radius", "sinus", "stylus", "syllabus", "trellis"
)

# Remove regular plurals: ends with 's', not in exceptions, and not ending with 'ss'
is_plural <- function(w) {
  nchar(w) > 3 &&
    grepl("s$", w) &&
    !grepl("ss$", w) &&
    !(w %in% exceptions)
}
words <- words[!sapply(words, is_plural)]

# Group words by their length
word_groups <- split(words, nchar(words))
word_groups <- word_groups[names(word_groups) %in% 3:10]

write_json(word_groups, "wordle/words.json", pretty = TRUE, auto_unbox = TRUE)
