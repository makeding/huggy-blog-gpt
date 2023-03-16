import { PGChunk, PGEssay, PGJSON } from "@/types";
import axios from "axios";
import { writeFileSync } from "fs";
import { encode } from "gpt-3-encoder";

const CHUNK_SIZE = 200;

const chunkEssay = async (essay: PGEssay) => {
  const { title, url, date, thanks, content, ...chunklessSection } = essay;

  let essayTextChunks = [];

  if (encode(content).length > CHUNK_SIZE) {
    const split = content.split("。"); // need use another character to split
    let chunkText = "";

    for (let i = 0; i < split.length; i++) {
      const sentence = split[i];
      const sentenceTokenLength = encode(sentence);
      const chunkTextTokenLength = encode(chunkText).length;

      if (chunkTextTokenLength + sentenceTokenLength.length > CHUNK_SIZE) {
        essayTextChunks.push(chunkText);
        chunkText = "";
      }

      if (sentence[sentence.length - 1] && sentence[sentence.length - 1].match(/[a-z0-9]/i)) {
        chunkText += sentence + ". ";
      } else {
        chunkText += sentence + " ";
      }
    }

    essayTextChunks.push(chunkText.trim());
  } else {
    essayTextChunks.push(content.trim());
  }

  const essayChunks = essayTextChunks.map((text) => {
    const trimmedText = text.trim();

    const chunk: PGChunk = {
      essay_title: title,
      essay_url: url,
      essay_date: date,
      essay_thanks: thanks,
      content: trimmedText,
      content_length: trimmedText.length,
      content_tokens: encode(trimmedText).length,
      embedding: []
    };

    return chunk;
  });

  if (essayChunks.length > 1) {
    for (let i = 0; i < essayChunks.length; i++) {
      const chunk = essayChunks[i];
      const prevChunk = essayChunks[i - 1];

      if (chunk.content_tokens < 100 && prevChunk) {
        prevChunk.content += " " + chunk.content;
        prevChunk.content_length += chunk.content_length;
        prevChunk.content_tokens += chunk.content_tokens;
        essayChunks.splice(i, 1);
        i--;
      }
    }
  }

  const chunkedSection: PGEssay = {
    ...essay,
    chunks: essayChunks
  };

  return chunkedSection;
};

(async () => {
  let essays = [];
  const d = await axios.get('https://blog.huggy.moe/searchindex.json')
  for (let i = 0; i < d.data.posts.length; i++) {
    const post = d.data.posts[i];
    const eassy: PGEssay = {
      title: post.title,
      url: post.uri,
      date: post.year,
      thanks: post.tags ? post.tags.join(', ') : "",
      content: post.content,
      length: post.content.length,
      tokens: encode(post.content).length,
      chunks: []
    }
    const chunkedEssay = await chunkEssay(eassy);
    essays.push(chunkedEssay);
  }

  const json: PGJSON = {
    current_date: "2023-03-16",
    author: "huggy",
    url: "https://blog.huggy.moe/posts/",
    length: essays.reduce((acc, essay) => acc + essay.length, 0),
    tokens: essays.reduce((acc, essay) => acc + essay.tokens, 0),
    essays
  };

  writeFileSync("scripts/pg.json", JSON.stringify(json));
})();
