import { ParsedEpubBook } from '../utils/epub-parser';
import { splitTextIntoSentences, estimateAudioDuration } from '../utils/audiobook-logic';

function createSampleBook(
  title: string,
  author: string,
  description: string,
  coverColor: string,
  rawChapters: { title: string; content: string }[]
): ParsedEpubBook {
  const chapters = rawChapters.map((ch, idx) => {
    const cleaned = ch.content.trim();
    const sentences = splitTextIntoSentences(cleaned);
    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
    return {
      id: `sample-ch-${idx + 1}`,
      index: idx + 1,
      title: ch.title,
      rawText: ch.content,
      cleanedText: cleaned,
      sentences,
      wordCount,
      durationSeconds: estimateAudioDuration(wordCount),
    };
  });

  const totalWords = chapters.reduce((a, b) => a + b.wordCount, 0);
  const totalDurationSeconds = chapters.reduce((a, b) => a + b.durationSeconds, 0);

  return {
    metadata: {
      title,
      author,
      description,
      language: 'en',
      publisher: 'Project Gutenberg / Public Domain Classics',
      totalWords,
      totalDurationSeconds,
      chapterCount: chapters.length,
      fileName: `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.epub`,
      coverUrl: coverColor, // used for styling or placeholder svg
    },
    chapters,
  };
}

export const SAMPLE_BOOKS: ParsedEpubBook[] = [
  createSampleBook(
    'The Time Machine',
    'H.G. Wells',
    'A Victorian scientist invents a device to journey into the distant future of Earth, discovering the idyllic Eloi and the sinister underground Morlocks.',
    'from-amber-700 via-orange-800 to-stone-900',
    [
      {
        title: 'Chapter 1: The Inventor’s Laboratory',
        content: `The Time Traveller was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burnt brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses.

Our chairs, being his patents, embraced and caressed us rather than submitted to be sat upon; and there was that luxurious after-dinner atmosphere when thought roams gracefully free of the trammels of precision. And he put it to us in this way—marking the points with a lean forefinger—as we sat and lazily admired his earnestness over this new paradox which he regarded as the foundation of his work.

"You must follow me carefully," he said. "I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, that you taught you at school is founded on a misconception. There are really four dimensions, three which we call the three planes of Space, and a fourth, Time."

There is, however, a tendency to draw an unreal distinction between the former three dimensions and the latter, because it happens that our consciousness moves intermittently along the latter from the beginning to the end of our lives.`
      },
      {
        title: 'Chapter 2: The Machine in Motion',
        content: `The thing the Time Traveller held in his hand was a glittering metallic framework, scarcely larger than a small clock, and very delicately made. There was ivory in it, and some transparent crystalline substance. And now I must be very plain, for what followed, unless his explanation is to be accepted, is an absolutely unaccountable thing.

He took one of the small octagonal tables that were scattered about the room, and set it in front of the fire, with two legs on the hearthrug. On this table he placed the mechanism. Then he drew up a chair and sat down.

The only other object on the table was a small shaded lamp, the bright light of which fell upon the model. There were also perhaps a dozen candles in lanterns about the room, so that the light was rich and clear.

"This little affair," said the Time Traveller, resting his elbows upon the table and pressing his hands together above the apparatus, "is only a model. It is that which shall travel through time. Watch!"

He put out his finger towards the little lever. "No," he said suddenly. "Lend me your hand." And turning to the Psychologist, he took that individual’s hand in his own and told him to put out his forefinger. So that it was the Psychologist himself who sent the model on its voyage.`
      },
      {
        title: 'Chapter 3: The Golden Age of 802,701 AD',
        content: `I drew a long breath, set my teeth, gripped the starting lever with both hands, and went off with a thud. The laboratory got hazy and went dark. Mrs. Watchett came in and walked, seemingly without seeing me, towards the garden door. I suppose it took her a minute to cross the place, but to me she seemed to shoot across the room like a rocket.

I pressed the lever over to its extreme position. The night came like the turning out of a lamp, and in another moment came tomorrow. The laboratory grew faint and hazy, then fainter and ever fainter. Tomorrow night came black, then day again, night again, day again, faster and faster still.

An eddying murmur filled my ears, and a strange, tumbling drowsiness came over my mind. As I went on, still gaining velocity, the palpitation of night and day merged into one continuous greyness; the sky took on a wonderful deepness of blue, a splendid luminous color like that of early twilight; the jerking sun became a streak of fire, a brilliant arch, in space.

At last I halted. I saw trees growing with incredible rapidity; huge buildings rose like mist and dissolved like dreams. I was looking into the year Eight Hundred and Two Thousand, Seven Hundred and One.`
      }
    ]
  ),
  createSampleBook(
    'A Scandal in Bohemia',
    'Arthur Conan Doyle',
    'Sherlock Holmes encounters Irene Adler, the brilliant opera singer who outwits the great detective in a high-stakes case involving European royalty.',
    'from-indigo-900 via-slate-800 to-stone-950',
    [
      {
        title: 'Chapter 1: The Woman',
        content: `To Sherlock Holmes she is always THE woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind.

He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position. He never spoke of the softer passions, save with a gibe and a sneer.

I had seen little of Holmes lately. My marriage had drifted us away from each other. My own complete happiness, and the home-centred interests which rise up around the man who first finds himself master of his own establishment, were sufficient to absorb all my attention.

One night—it was on the twentieth of March, 1888—I was returning from a journey to a patient, for I had now returned to civil practice, when my way led me through Baker Street. As I passed the well-remembered door, a keen desire came over me to see Holmes again, and to know how he was employing his extraordinary powers.`
      },
      {
        title: 'Chapter 2: A Masked Visitor',
        content: `A slow and heavy step, which had been heard upon the stairs and in the passage, paused immediately outside the door. Then there was a loud and authoritative tap.

"Come in!" said Holmes.

A man entered who could not have been less than six feet six inches in height, with the chest and limbs of a Hercules. His dress was rich with a richness which would, in England, be regarded as akin to bad taste. Heavy bands of astrakhan were slashed across the sleeves and fronts of his double-breasted coat, while the deep blue cloak which was thrown over his shoulders was lined with flame-coloured silk and secured at the neck with a brooch which consisted of a single flaming beryl.

He held a broad-brimmed hat in his hand, while he wore across the upper part of his face, extending down past the cheekbones, a black vizard mask, which he had apparently adjusted that very moment, for his hand was still raised to it as he entered.

"You had my note?" he asked with a deep, harsh voice and a strongly marked German accent. "I told you that I would call."`
      }
    ]
  ),
  createSampleBook(
    'Alice in Wonderland',
    'Lewis Carroll',
    'The timeless journey of curious Alice down the rabbit-hole into a surreal world of white rabbits, the Mad Hatter, and the Queen of Hearts.',
    'from-emerald-800 via-teal-900 to-slate-900',
    [
      {
        title: 'Chapter 1: Down the Rabbit-Hole',
        content: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversations?"

So she was considering in her own mind—as well as she could, for the hot day made her feel very sleepy and stupid—whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so VERY remarkable in that; nor did Alice think it so VERY much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" But when the Rabbit actually TOOK A WATCH OUT OF ITS WAISTCOAT-POCKET, and looked at it, and then hurried on, Alice started to her feet.

Burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge. In another moment down went Alice after it, never once considering how in the world she was to get out again.`
      },
      {
        title: 'Chapter 2: The Pool of Tears',
        content: `"Curiouser and curiouser!" cried Alice—she was so much surprised, that for the moment she quite forgot how to speak good English. "Now I'm opening out like the largest telescope that ever was! Good-bye, feet!"

For when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off. "Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears? I'm sure I shan't be able! I shall be a great deal too far off to trouble myself about you."

Just at this moment her head struck against the roof of the hall: in fact she was now more than nine feet high, and she at once took up the little golden key and hurried off to the garden door.

Poor Alice! It was as much as she could do, lying down on one side, to look through into the garden with one eye; but to get through was more hopeless than ever: she sat down and began to cry again.`
      }
    ]
  )
];
