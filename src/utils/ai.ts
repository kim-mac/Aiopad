import { HfInference } from '@huggingface/inference';

// Initialize with personal access token
const inference = new HfInference("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");

export interface AICompletionOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export async function getTextCompletion(
  prompt: string,
  options: AICompletionOptions = {}
): Promise<string> {
  try {
    const response = await inference.textGeneration({
      model: 'gpt2',
      inputs: prompt,
      parameters: {
        max_new_tokens: options.maxTokens ?? 100,
        temperature: options.temperature ?? 0.7,
        stop_sequences: options.stopSequences,
        return_full_text: false,
      }
    });

    return response.generated_text.trim();
  } catch (error) {
    console.error('Error getting AI completion:', error);
    return '';
  }
}

export async function getSuggestions(
  currentText: string,
): Promise<string> {
  const prompt = `${currentText}`;
  return getTextCompletion(prompt, {
    maxTokens: 50,
    temperature: 0.7,
    stopSequences: ['\n', '.', '!', '?'],
  });
}

export async function summarizeText(
  text: string,
): Promise<string> {
  try {
    const response = await inference.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: text,
      parameters: {
        max_length: 250,
        min_length: 100,
        length_penalty: 2.0,
        num_beams: 4,
      }
    });
    
    const summaryPoints = response.summary_text
      .split('. ')
      .map(point => point.trim())
      .filter(point => point.length > 0)
      .map(point => `• ${point}${!point.endsWith('.') ? '.' : ''}`);
    
    return summaryPoints.join('\n');
  } catch (error) {
    console.error('Error summarizing text:', error);
    return '';
  }
}

export async function improveWriting(
  text: string,
): Promise<string> {
  try {
    let improvedText = text;

    // Capitalize first letter of sentences
    improvedText = improvedText.replace(/(^\w|[.!?]\s+\w)/g, letter => letter.toUpperCase());

    // Fix common typos and improve common phrases
    const improvements = {
      // Contractions
      'alot': 'a lot',
      'cant': "can't",
      'dont': "don't",
      'didnt': "didn't",
      'couldnt': "couldn't",
      'wouldnt': "wouldn't",
      'shouldnt': "shouldn't",
      'im': "I'm",
      'i ': 'I ',
      'ive': "I've",
      'id': "I'd",
      'ill': "I'll",
      'wont': "won't",
      'hasnt': "hasn't",
      'havent': "haven't",
      'isnt': "isn't",
      'arent': "aren't",
      'wasnt': "wasn't",
      'werent': "weren't",
      'youre': "you're",
      'youve': "you've",
      'youd': "you'd",
      'theyre': "they're",
      'theyve': "they've",
      'theyd': "they'd",
      'its ': 'it is ',
      'thats': "that's",
      'whats': "what's",
      'hes': "he's",
      'shes': "she's",
      'whos': "who's",
      'howd': "how'd",
      'whatd': "what'd",
      'lets': "let's",

      // Common informal phrases
      'gonna': 'going to',
      'wanna': 'want to',
      'kinda': 'kind of',
      'sorta': 'sort of',
      'gotta': 'got to',
      'dunno': 'do not know',
      'yeah': 'yes',
      'nah': 'no',
      'aswell': 'as well',
      'eventhough': 'even though',
      'atleast': 'at least',
      'alright': 'all right',
      'cuz': 'because',
      'cause': 'because',
      'thru': 'through',
      'tho': 'though',
      'u ': 'you ',
      'ur ': 'your ',
      'r ': 'are ',
      'y ': 'why ',
      'k ': 'okay ',
      'prob ': 'probably ',
      'mins': 'minutes',
      'sec': 'second',
      'hrs': 'hours',

      // Business/Professional terms
      'asap': 'as soon as possible',
      'fyi': 'for your information',
      'roi': 'return on investment',
      'cob': 'close of business',
      'eod': 'end of day',
      'tbd': 'to be determined',
      'tbh': 'to be honest',
      'imo': 'in my opinion',
      'imho': 'in my honest opinion',
      'faq': 'frequently asked questions',
      'toc': 'table of contents',
      'aka': 'also known as',
      'dept': 'department',
      'mgmt': 'management',
      'approx': 'approximately',
      'misc': 'miscellaneous',
      'specs': 'specifications',
      'stats': 'statistics',
      'temp': 'temperature',
      'qty': 'quantity',

      // Academic/Technical
      'etc': 'etc.',
      'eg': 'e.g.',
      'ie': 'i.e.',
      'et al': 'et al.',
      'vs': 'versus',
      'fig': 'figure',
      'eq': 'equation',
      'ch': 'chapter',
      'pg': 'page',
      'pp': 'pages',
      'ref': 'reference',
      'refs': 'references',
      'vol': 'volume',
      'rev': 'revision',
      'ver': 'version',

      // Common misspellings
      'seperate': 'separate',
      'definately': 'definitely',
      'defiantly': 'definitely',
      'occured': 'occurred',
      'occuring': 'occurring',
      'untill': 'until',
      'allways': 'always',
      'allmost': 'almost',
      'loosing': 'losing',
      'wierd': 'weird',
      'recieve': 'receive',
      'truely': 'truly',
      'beleive': 'believe',
      'peice': 'piece',
      'freind': 'friend',
      'feild': 'field',
      'foriegn': 'foreign',
      'hygeine': 'hygiene',
      'independant': 'independent',
      'liason': 'liaison',
      'millenium': 'millennium',
      'neccessary': 'necessary',
      'occassion': 'occasion',
      'occurence': 'occurrence',
      'pavillion': 'pavilion',
      'persistant': 'persistent',
      'personnell': 'personnel',
      'playright': 'playwright',
      'posession': 'possession',
      'prefered': 'preferred',
      'propoganda': 'propaganda',
      'questionaire': 'questionnaire',
      'reccomend': 'recommend',
      'rythm': 'rhythm',
      'secratary': 'secretary',
      'tendancy': 'tendency',
      'threshhold': 'threshold',
      'tounge': 'tongue',
      'truley': 'truly',
      'vaccuum': 'vacuum',
      'vegatables': 'vegetables',
      'vehical': 'vehicle',
      'visable': 'visible',
      'warrenty': 'warranty',
      'wether': 'whether',
      'wich': 'which',
      'writeing': 'writing'
    };

    // Apply improvements
    Object.entries(improvements).forEach(([incorrect, correct]) => {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      improvedText = improvedText.replace(regex, correct);
    });

    // Fix spacing after punctuation
    improvedText = improvedText.replace(/([.!?,;:])(\w)/g, '$1 $2');

    // Remove multiple spaces
    improvedText = improvedText.replace(/\s+/g, ' ');

    // Fix spacing around parentheses
    improvedText = improvedText.replace(/\s*\(\s*/g, ' (').replace(/\s*\)\s*/g, ') ');

    // Remove spaces before punctuation
    improvedText = improvedText.replace(/\s+([.!?,;:])/g, '$1');

    // Add space after punctuation if missing
    improvedText = improvedText.replace(/([.!?,;:])(\w)/g, '$1 $2');

    // Fix ellipsis
    improvedText = improvedText.replace(/\.{2,}/g, '...');

    // Fix em dashes
    improvedText = improvedText.replace(/--/g, '—');

    // Fix quotes
    improvedText = improvedText.replace(/"([^"]*)"/g, '"$1"');

    // Fix common number formats
    improvedText = improvedText.replace(/(\d+)k\b/gi, '$1,000');
    improvedText = improvedText.replace(/(\d+)m\b/gi, '$1,000,000');

    // Fix common date formats
    improvedText = improvedText.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g, (match, p1, p2, p3) => {
      const month = p1.padStart(2, '0');
      const day = p2.padStart(2, '0');
      const year = p3.length === 2 ? `20${p3}` : p3;
      return `${month}/${day}/${year}`;
    });

    // Trim extra spaces
    improvedText = improvedText.trim();

    return improvedText;
  } catch (error) {
    console.error('Error improving text:', error);
    return text;
  }
}

export async function paraphraseText(
  text: string,
): Promise<string> {
  try {
    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let paraphrasedText = '';

    for (const sentence of sentences) {
      let modifiedSentence = sentence.trim();

      // Common phrase replacements (more natural and grammatically correct)
      const phraseReplacements = {
        'in my opinion': ['I believe that', 'from my perspective', 'in my view'],
        'for example': ['as an illustration', 'to demonstrate this', 'as a case in point'],
        'in other words': ['to put it differently', 'stated another way', 'that is to say'],
        'as a result': ['consequently', 'as a consequence', 'for this reason'],
        'in addition': ['furthermore', 'moreover', 'what is more'],
        'however': ['nevertheless', 'nonetheless', 'even so'],
        'therefore': ['thus', 'hence', 'as a result'],
        'in conclusion': ['to sum up', 'in summary', 'to conclude'],
        'because of': ['due to', 'owing to', 'on account of'],
        'similar to': ['comparable to', 'analogous to', 'akin to'],
      };

      // Word replacements (maintaining grammar)
      const wordReplacements = {
        // Verbs (maintaining tense)
        'want': ['desire', 'wish', 'seek'],
        'think': ['believe', 'consider', 'suppose'],
        'understand': ['comprehend', 'grasp', 'recognize'],
        'help': ['assist', 'support', 'aid'],
        'show': ['demonstrate', 'indicate', 'reveal'],
        'use': ['utilize', 'employ', 'apply'],
        'create': ['develop', 'produce', 'generate'],
        'improve': ['enhance', 'upgrade', 'refine'],
        'increase': ['enhance', 'boost', 'raise'],
        'decrease': ['reduce', 'lower', 'diminish'],

        // Adjectives
        'important': ['significant', 'crucial', 'essential'],
        'difficult': ['challenging', 'demanding', 'complex'],
        'easy': ['straightforward', 'simple', 'effortless'],
        'good': ['excellent', 'beneficial', 'advantageous'],
        'bad': ['unfavorable', 'problematic', 'detrimental'],
        'big': ['substantial', 'considerable', 'significant'],
        'small': ['minimal', 'modest', 'limited'],
        'interesting': ['intriguing', 'fascinating', 'compelling'],
        'useful': ['beneficial', 'valuable', 'practical'],
        'necessary': ['essential', 'crucial', 'vital'],

        // Adverbs
        'quickly': ['rapidly', 'swiftly', 'promptly'],
        'slowly': ['gradually', 'steadily', 'carefully'],
        'easily': ['effortlessly', 'readily', 'smoothly'],
        'effectively': ['efficiently', 'successfully', 'productively'],
        'significantly': ['substantially', 'considerably', 'markedly'],
      };

      // Apply phrase replacements first
      Object.entries(phraseReplacements).forEach(([phrase, alternatives]) => {
        const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
        if (regex.test(modifiedSentence)) {
          const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
          modifiedSentence = modifiedSentence.replace(regex, replacement);
        }
      });

      // Then apply word replacements
      Object.entries(wordReplacements).forEach(([word, alternatives]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(modifiedSentence)) {
          const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
          modifiedSentence = modifiedSentence.replace(regex, replacement);
        }
      });

      // Sentence structure variations (maintaining grammar)
      if (modifiedSentence.startsWith('It is') || modifiedSentence.startsWith('There is')) {
        // Keep these structures as they are (they're already good)
      } else if (modifiedSentence.includes(',')) {
        // For sentences with commas, try moving clauses
        const clauses = modifiedSentence.split(',');
        if (Math.random() > 0.5 && clauses.length > 1) {
          modifiedSentence = clauses[1].trim() + ', ' + clauses[0].trim();
        }
      } else if (modifiedSentence.toLowerCase().startsWith('i ')) {
        // Change personal statements to more formal ones
        modifiedSentence = modifiedSentence
          .replace(/^I think/i, 'It appears that')
          .replace(/^I believe/i, 'It is believed that')
          .replace(/^I know/i, 'It is known that')
          .replace(/^I feel/i, 'It seems that');
      }

      // Ensure proper capitalization and spacing
      modifiedSentence = modifiedSentence.trim();
      modifiedSentence = modifiedSentence.charAt(0).toUpperCase() + modifiedSentence.slice(1);
      
      // Add proper punctuation if missing
      if (!/[.!?]$/.test(modifiedSentence)) {
        modifiedSentence += '.';
      }

      paraphrasedText += modifiedSentence + ' ';
    }

    return paraphrasedText.trim();
  } catch (error) {
    console.error('Error paraphrasing text:', error);
    return text;
  }
}

export interface AIDetectionResult {
  isAIGenerated: boolean;
  confidence: number;
  indicators: string[];
}

export function detectAIText(text: string): AIDetectionResult {
  const indicators: string[] = [];
  let score = 0;
  
  // Common AI text patterns
  const patterns = {
    repetitiveStructures: /(.{30,}?)\1/g, // Repeated phrases
    formalTransitions: /\b(furthermore|moreover|additionally|consequently|therefore)\b/gi,
    perfectGrammar: /^[A-Z][^.!?]*[.!?](\s+[A-Z][^.!?]*[.!?])*$/,
    genericPhrases: /\b(it is important to note|as mentioned earlier|in conclusion|to summarize)\b/gi,
    consistentPunctuation: /[.!?]\s+[A-Z]/g,
    longSentences: /[^.!?]+[.!?]/g,
  };

  // Check for repetitive structures
  if (patterns.repetitiveStructures.test(text)) {
    score += 0.2;
    indicators.push("Contains repetitive patterns");
  }

  // Check for excessive formal transitions
  const formalTransitionsCount = (text.match(patterns.formalTransitions) || []).length;
  const wordCount = text.split(/\s+/).length;
  if (formalTransitionsCount / wordCount > 0.05) {
    score += 0.15;
    indicators.push("High usage of formal transitions");
  }

  // Check for perfect grammar and structure
  if (patterns.perfectGrammar.test(text)) {
    score += 0.2;
    indicators.push("Unusually perfect grammar");
  }

  // Check for generic academic phrases
  const genericPhraseCount = (text.match(patterns.genericPhrases) || []).length;
  if (genericPhraseCount > 0) {
    score += 0.15;
    indicators.push("Contains common AI/academic phrases");
  }

  // Check for consistent punctuation and capitalization
  const consistentPunctuationCount = (text.match(patterns.consistentPunctuation) || []).length;
  const sentences = text.match(patterns.longSentences) || [];
  if (consistentPunctuationCount === sentences.length) {
    score += 0.15;
    indicators.push("Extremely consistent punctuation");
  }

  // Check for sentence length variation
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((a, b) => a + Math.pow(b - avgLength, 2), 0) / sentenceLengths.length;
  if (variance < 5) {
    score += 0.15;
    indicators.push("Low sentence length variation");
  }

  return {
    isAIGenerated: score > 0.5,
    confidence: Math.min(score, 1),
    indicators
  };
}

export function humanizeText(text: string): string {
  try {
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let humanizedText = '';

    // Common filler words and expressions to add variety
    const fillers = [
      'you know',
      'like',
      'I mean',
      'actually',
      'basically',
      'pretty much',
      'kind of',
      'sort of',
      'honestly',
      'literally',
    ];

    // Informal contractions and variations
    const contractions = {
      'it is': "it's",
      'I am': "I'm",
      'you are': "you're",
      'they are': "they're",
      'we are': "we're",
      'that is': "that's",
      'what is': "what's",
      'could have': "could've",
      'should have': "should've",
      'would have': "would've",
    };

    // Casual interjections
    const interjections = [
      'well,',
      'so,',
      'right,',
      'look,',
      'okay,',
      'yeah,',
      'hey,',
    ];

    // Personal pronouns to make text more conversational
    const personalPronouns = {
      'one should': 'you should',
      'it is recommended': 'I recommend',
      'it can be seen': 'you can see',
      'it is suggested': 'I suggest',
    };

    for (let i = 0; i < sentences.length; i++) {
      let sentence = sentences[i].trim();

      // Randomly add interjections at the start of some sentences
      if (Math.random() < 0.2) {
        const randomInterjection = interjections[Math.floor(Math.random() * interjections.length)];
        sentence = randomInterjection + ' ' + sentence.charAt(0).toLowerCase() + sentence.slice(1);
      }

      // Add occasional filler words
      if (Math.random() < 0.15) {
        const filler = fillers[Math.floor(Math.random() * fillers.length)];
        const words = sentence.split(' ');
        const position = Math.floor(Math.random() * words.length);
        words.splice(position, 0, filler);
        sentence = words.join(' ');
      }

      // Replace formal structures with contractions
      Object.entries(contractions).forEach(([formal, contraction]) => {
        const regex = new RegExp(`\\b${formal}\\b`, 'gi');
        if (Math.random() < 0.7) { // 70% chance to use contraction
          sentence = sentence.replace(regex, contraction);
        }
      });

      // Make text more personal
      Object.entries(personalPronouns).forEach(([formal, personal]) => {
        const regex = new RegExp(`\\b${formal}\\b`, 'gi');
        sentence = sentence.replace(regex, personal);
      });

      // Add slight imperfections
      if (Math.random() < 0.1) {
        sentence = sentence.replace(/\b(\w+),/, '$1...'); // Replace some commas with ellipsis
      }

      // Vary sentence endings
      if (sentence.endsWith('.') && Math.random() < 0.2) {
        sentence = sentence.slice(0, -1) + (Math.random() < 0.5 ? '...' : '!');
      }

      // Add occasional self-corrections
      if (Math.random() < 0.1) {
        const words = sentence.split(' ');
        const position = Math.floor(Math.random() * words.length);
        words.splice(position, 0, 'I mean,');
        sentence = words.join(' ');
      }

      // Ensure proper spacing and capitalization
      sentence = sentence.trim();
      if (!sentence.match(/^[A-Z]/)) {
        sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
      }

      humanizedText += sentence + ' ';
    }

    // Add occasional typos and quick corrections
    if (Math.random() < 0.15) {
      const words = humanizedText.split(' ');
      const position = Math.floor(Math.random() * words.length);
      const word = words[position];
      if (word.length > 3) {
        const typo = word.slice(0, -1) + '*' + word.slice(-1) + ' ' + word;
        words.splice(position, 1, typo);
        humanizedText = words.join(' ');
      }
    }

    return humanizedText.trim();
  } catch (error) {
    console.error('Error humanizing text:', error);
    return text;
  }
} 