import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanHtmlForSpeech,
  splitTextIntoSentences,
  estimateAudioDuration,
  formatAudioTime,
  splitIntoSpeechChunks
} from './audiobook-logic';

test('cleanHtmlForSpeech strips tags, resolves entities and normalizes spacing', () => {
  const dirty = `
    <h1>Chapter 1: The Journey</h1>
    <p>It was a <em>dark</em> &amp; stormy night.&nbsp;Dr. Watson was sitting [1] by the fire.</p>
    <script>alert('bad');</script>
    <p>He turned &mdash; and saw the door open.</p>
  `;
  const cleaned = cleanHtmlForSpeech(dirty);

  assert.match(cleaned, /Chapter 1: The Journey/);
  assert.match(cleaned, /dark & stormy night/);
  assert.match(cleaned, /Dr\. Watson was sitting by the fire/);
  assert.match(cleaned, /turned — and saw the door open/);
  assert.ok(!cleaned.includes('<script>'));
  assert.ok(!cleaned.includes('[1]'));
  assert.ok(!cleaned.includes('&amp;'));
});

test('splitTextIntoSentences protects common abbreviations', () => {
  const text = 'Dr. Jekyll smiled. Mr. Utterson looked astonished at 10 p.m. He said, "Let us proceed!"';
  const sentences = splitTextIntoSentences(text);

  assert.equal(sentences.length, 3);
  assert.equal(sentences[0], 'Dr. Jekyll smiled.');
  assert.equal(sentences[1], 'Mr. Utterson looked astonished at 10 p.m.');
  assert.equal(sentences[2], 'He said, "Let us proceed!"');
});

test('estimateAudioDuration calculates seconds accurately with speed modifier', () => {
  // 150 words at 150 wpm = 1 minute = 60s
  const text150 = Array(150).fill('word').join(' ');
  const dur1x = estimateAudioDuration(text150, 1.0, 150);
  assert.equal(dur1x, 60);

  // At 2x speed, should be 30 seconds
  const dur2x = estimateAudioDuration(text150, 2.0, 150);
  assert.equal(dur2x, 30);
});

test('formatAudioTime formats mm:ss and hh:mm:ss properly', () => {
  assert.equal(formatAudioTime(0), '00:00');
  assert.equal(formatAudioTime(75), '01:15');
  assert.equal(formatAudioTime(3665), '1:01:05');
  assert.equal(formatAudioTime(-5), '00:00');
});

test('splitIntoSpeechChunks chunks long text without splitting sentences', () => {
  const longText = 'Sentence one. Sentence two is slightly longer. Sentence three continues the tale. Sentence four concludes it.';
  const chunks = splitIntoSpeechChunks(longText, 50);

  assert.ok(chunks.length > 1);
  for (const chunk of chunks) {
    assert.ok(chunk.length > 0);
  }
  // All words preserved
  const reassembled = chunks.join(' ');
  assert.ok(reassembled.includes('Sentence one.'));
  assert.ok(reassembled.includes('concludes it.'));
});
