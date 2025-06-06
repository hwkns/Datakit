import { PublicDataset } from "@/types/remoteImport";

// AWS S3 Datasets
const S3_PUBLIC_DATASETS: PublicDataset[] = [
  {
    id: "noaa-ghcn-stations",
    name: "NOAA Weather Stations",
    description:
      "Complete global list of NOAA weather stations with coordinates and metadata.",
    category: "weather",
    format: ["TXT"],
    size: "4.5 MB",
    lastUpdated: "2024-12-01",
    url: "s3://noaa-ghcn-pds/ghcnd-stations.txt",
    s3Url: "s3://noaa-ghcn-pds/ghcnd-stations.txt",
    httpUrl: "https://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-stations.txt",
    documentation: "https://registry.opendata.aws/noaa-ghcn/",
    tags: ["weather", "stations", "global", "coordinates", "metadata"],
    featured: true,
    provider: "aws",
    license: "CC0-1.0",
    updateFrequency: "Monthly",
    bucket: "noaa-ghcn-pds",
    region: "us-east-1",
    corsStatus: "proxy-required",
  },
  {
    id: "openaq-single-day-sample",
    name: "OpenAQ Air Quality",
    description:
      "Single day of global air quality measurements from OpenAQ. PM2.5, NO2, O3 pollution data.",
    category: "health",
    format: ["CSV"],
    size: "5 MB",
    lastUpdated: "2024-12-01",
    url: "s3://openaq-data-archive/records/csv.gz/locationid=2178/year=2022/month=05/location-2178-20220503.csv.gz",
    s3Url:
      "s3://openaq-data-archive/records/csv.gz/locationid=2178/year=2022/month=05/location-2178-20220503.csv.gz",
    httpUrl:
      "https://openaq-data-archive.s3.amazonaws.com/records/csv.gz/locationid=2178/year=2022/month=05/location-2178-20220503.csv.gz",
    documentation: "https://docs.openaq.org/docs/accessing-openaq-archive-data",
    tags: ["air-quality", "pollution", "pm25", "environmental", "global"],
    featured: true,
    provider: "aws",
    license: "CC BY 4.0",
    updateFrequency: "Daily",
    bucket: "openaq-data-archive",
    region: "us-east-1",
    corsStatus: "proxy-required",
  },
  {
    id: "noaa-ghcn-historical-1763",
    name: "NOAA Weather Data 1763",
    description: "The very first weather data in NOAA dataset from 1763.",
    category: "weather",
    format: ["CSV"],
    size: "64 KB",
    lastUpdated: "2024-12-01",
    url: "s3://noaa-ghcn-pds/csv/by_year/1763.csv",
    s3Url: "s3://noaa-ghcn-pds/csv/by_year/1763.csv",
    httpUrl: "https://noaa-ghcn-pds.s3.amazonaws.com/csv/by_year/1763.csv",
    documentation: "https://registry.opendata.aws/noaa-ghcn/",
    tags: ["weather", "historical", "1763", "earliest", "colonial"],
    featured: false,
    provider: "aws",
    license: "CC0-1.0",
    updateFrequency: "Static",
    bucket: "noaa-ghcn-pds",
    region: "us-east-1",
    corsStatus: "proxy-required",
  },
];

// GitHub & Direct URL Datasets
const GITHUB_PUBLIC_DATASETS: PublicDataset[] = [
  {
    id: "iris-dataset",
    name: "Iris Flower Dataset",
    description:
      "Classic machine learning dataset with 150 samples of iris flowers and their measurements.",
    category: "sample",
    format: ["CSV"],
    size: "4 KB",
    lastUpdated: "2024-01-01",
    url: "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv",
    httpUrl:
      "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv",
    documentation: "https://en.wikipedia.org/wiki/Iris_flower_data_set",
    tags: [
      "machine-learning",
      "classification",
      "flowers",
      "small",
      "beginner",
    ],
    featured: true,
    provider: "github",
    license: "Public Domain",
    updateFrequency: "Static",
    repository: "mwaskom/seaborn-data",
    branch: "master",
    path: "iris.csv",
  },
  {
    id: "titanic-dataset",
    name: "Titanic Passenger Data",
    description:
      "Passenger data from the Titanic disaster, commonly used for data analysis tutorials.",
    category: "sample",
    format: ["CSV"],
    size: "59 KB",
    lastUpdated: "2024-01-01",
    url: "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/titanic.csv",
    httpUrl:
      "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/titanic.csv",
    documentation: "https://www.kaggle.com/c/titanic",
    tags: [
      "historical",
      "demographics",
      "survival-analysis",
      "tutorial",
      "beginner",
    ],
    featured: true,
    provider: "github",
    license: "Public Domain",
    updateFrequency: "Static",
    repository: "mwaskom/seaborn-data",
    branch: "master",
    path: "titanic.csv",
  },
  {
    id: "nyc-flights-sample",
    name: "NYC Flights 2013 Sample",
    description:
      "Sample of flight departure data from NYC airports in 2013. Great for time series analysis.",
    category: "transportation",
    format: ["CSV"],
    size: "2.8 MB",
    lastUpdated: "2024-01-01",
    url: "https://raw.githubusercontent.com/hadley/nycflights13/master/data-raw/flights.csv",
    httpUrl:
      "https://raw.githubusercontent.com/hadley/nycflights13/master/data-raw/flights.csv",
    documentation: "https://github.com/hadley/nycflights13",
    tags: ["transportation", "flights", "time-series", "nyc", "medium"],
    featured: false,
    provider: "github",
    license: "CC0-1.0",
    updateFrequency: "Static",
    repository: "hadley/nycflights13",
    branch: "master",
    path: "data-raw/flights.csv",
  },
  {
    id: "covid-19-global",
    name: "COVID-19 Global Data",
    description:
      "Time series data of COVID-19 cases, deaths, and recoveries by country.",
    category: "health",
    format: ["CSV"],
    size: "12 MB",
    lastUpdated: "2024-12-01",
    url: "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv",
    httpUrl:
      "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv",
    documentation: "https://github.com/CSSEGISandData/COVID-19",
    tags: ["health", "pandemic", "time-series", "global", "medium"],
    featured: false,
    provider: "github",
    license: "Public Domain",
    updateFrequency: "Daily",
    repository: "CSSEGISandData/COVID-19",
    branch: "master",
    path: "csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv",
  },
  {
    id: "us-population-census",
    name: "US Population by State",
    description:
      "US Census population data by state from 1900-2020. Useful for demographic analysis.",
    category: "government",
    format: ["CSV"],
    size: "45 KB",
    lastUpdated: "2024-01-01",
    url: "https://raw.githubusercontent.com/plotly/datasets/master/1962_2006_walmart_store_openings.csv",
    httpUrl:
      "https://raw.githubusercontent.com/plotly/datasets/master/1962_2006_walmart_store_openings.csv",
    documentation: "https://github.com/plotly/datasets",
    tags: ["demographics", "census", "government", "historical", "small"],
    featured: false,
    provider: "github",
    license: "MIT",
    updateFrequency: "Static",
    repository: "plotly/datasets",
    branch: "master",
    path: "1962_2006_walmart_store_openings.csv",
  },
  {
    id: "world-happiness-report",
    name: "World Happiness Report",
    description:
      "Global happiness scores and factors by country from the UN World Happiness Report.",
    category: "research",
    format: ["CSV"],
    size: "15 KB",
    lastUpdated: "2024-01-01",
    url: "https://raw.githubusercontent.com/datasets/world-happiness/master/data/2019.csv",
    httpUrl:
      "https://raw.githubusercontent.com/datasets/world-happiness/master/data/2019.csv",
    documentation: "https://worldhappiness.report/",
    tags: ["happiness", "global", "research", "wellbeing", "small"],
    featured: false,
    provider: "github",
    license: "CC BY 4.0",
    updateFrequency: "Yearly",
    repository: "datasets/world-happiness",
    branch: "master",
    path: "data/2019.csv",
  },
  {
    id: "tesla-stock-data",
    name: "Tesla Stock Prices",
    description:
      "Historical Tesla (TSLA) stock price data with OHLCV information.",
    category: "finance",
    format: ["CSV"],
    size: "89 KB",
    lastUpdated: "2024-01-01",
    url: "https://raw.githubusercontent.com/plotly/datasets/master/tesla-stock-price.csv",
    httpUrl:
      "https://raw.githubusercontent.com/plotly/datasets/master/tesla-stock-price.csv",
    documentation: "https://github.com/plotly/datasets",
    tags: ["finance", "stocks", "tesla", "time-series", "small"],
    featured: false,
    provider: "github",
    license: "MIT",
    updateFrequency: "Static",
    repository: "plotly/datasets",
    branch: "master",
    path: "tesla-stock-price.csv",
  },
];


export const HUGGINGFACE_PUBLIC_DATASETS: PublicDataset[] = [
  // Language/Text Datasets
  {
    id: "rajpurkar/squad",
    name: "SQuAD",
    description: "Stanford Question Answering Dataset - A reading comprehension dataset with 100k+ question-answer pairs",
    provider: "huggingface",
    category: "nlp",
    size: "35.1MB",
    format: ["parquet"],
    tags: ["question-answering", "english", "text"],
    featured: true,
    downloads: 50000,
    likes: 245,
    task: "Question Answering",
    gated: false,
    lastModified: "2023-10-15",
    repository: "rajpurkar/squad",
    url: "https://huggingface.co/datasets/rajpurkar/squad"
  },
  {
    id: "stanfordnlp/imdb",
    name: "IMDB Movie Reviews",
    description: "Large Movie Review Dataset for binary sentiment classification with 50k highly polar movie reviews",
    provider: "huggingface",
    category: "nlp",
    size: "66.9MB",
    format: ["parquet"],
    tags: ["sentiment-analysis", "text-classification", "english"],
    featured: true,
    downloads: 75000,
    likes: 312,
    task: "Sentiment Analysis",
    gated: false,
    lastModified: "2023-11-20",
    repository: "stanfordnlp/imdb",
    url: "https://huggingface.co/datasets/stanfordnlp/imdb"
  },
  {
    id: "wikitext",
    name: "WikiText-103",
    description: "Collection of over 100 million tokens extracted from Wikipedia articles for language modeling",
    provider: "huggingface",
    category: "nlp",
    size: "181MB",
    format: ["parquet"],
    tags: ["language-modeling", "text-generation", "english"],
    featured: false,
    downloads: 25000,
    likes: 145,
    task: "Language Modeling",
    gated: false,
    lastModified: "2023-09-12",
    repository: "wikitext",
    url: "https://huggingface.co/datasets/wikitext"
  },
  {
    id: "PolyAI/banking77",
    name: "Banking77",
    description: "Dataset for intent classification in banking domain with 77 intents and 13k customer queries",
    provider: "huggingface",
    category: "nlp",
    size: "2.4MB",
    format: ["parquet"],
    tags: ["intent-classification", "banking", "text-classification"],
    featured: false,
    downloads: 12000,
    likes: 89,
    task: "Intent Classification",
    gated: false,
    lastModified: "2023-08-30",
    repository: "PolyAI/banking77",
    url: "https://huggingface.co/datasets/PolyAI/banking77"
  },

  // Computer Vision Datasets
  {
    id: "cifar10",
    name: "CIFAR-10",
    description: "60k 32x32 color images in 10 classes, with 6k images per class. Classic computer vision dataset",
    provider: "huggingface",
    category: "computer-vision",
    size: "132MB",
    format: ["parquet"],
    tags: ["image-classification", "computer-vision", "10-classes"],
    featured: true,
    downloads: 45000,
    likes: 278,
    task: "Image Classification",
    gated: false,
    lastModified: "2023-10-05",
    repository: "cifar10",
    url: "https://huggingface.co/datasets/cifar10"
  },
  {
    id: "fashion_mnist",
    name: "Fashion-MNIST",
    description: "Drop-in replacement for MNIST with 70k grayscale images of fashion items in 10 categories",
    provider: "huggingface",
    category: "computer-vision",
    size: "29.5MB",
    format: ["parquet"],
    tags: ["image-classification", "fashion", "mnist-alternative"],
    featured: false,
    downloads: 18000,
    likes: 156,
    task: "Image Classification",
    gated: false,
    lastModified: "2023-09-18",
    repository: "fashion_mnist",
    url: "https://huggingface.co/datasets/fashion_mnist"
  },

  // Audio Datasets
  {
    id: "mozilla-foundation/common_voice_11_0",
    name: "Common Voice 11.0",
    description: "Mozilla's multilingual speech corpus with voices in 100+ languages for speech recognition",
    provider: "huggingface",
    category: "audio",
    size: "2.1GB",
    format: ["parquet"],
    tags: ["speech-recognition", "multilingual", "audio"],
    featured: true,
    downloads: 8500,
    likes: 234,
    task: "Speech Recognition",
    gated: true, // Requires agreement
    lastModified: "2023-11-01",
    repository: "mozilla-foundation/common_voice_11_0",
    url: "https://huggingface.co/datasets/mozilla-foundation/common_voice_11_0"
  },

  // Structured/Tabular Datasets
  {
    id: "scikit-learn/iris",
    name: "Iris Dataset",
    description: "Classic dataset with 150 instances of iris flowers with 4 features each, perfect for ML beginners",
    provider: "huggingface",
    category: "tabular",
    size: "4.8KB",
    format: ["parquet"],
    tags: ["classification", "tabular", "flowers", "classic"],
    featured: false,
    downloads: 15000,
    likes: 95,
    task: "Classification",
    gated: false,
    lastModified: "2023-07-22",
    repository: "scikit-learn/iris",
    url: "https://huggingface.co/datasets/scikit-learn/iris"
  },
  {
    id: "titanic",
    name: "Titanic Dataset",
    description: "Passenger data from the Titanic with survival outcomes, great for binary classification",
    provider: "huggingface",
    category: "tabular",
    size: "59.8KB",
    format: ["parquet"],
    tags: ["classification", "tabular", "survival-analysis"],
    featured: false,
    downloads: 22000,
    likes: 167,
    task: "Binary Classification",
    gated: false,
    lastModified: "2023-08-14",
    repository: "titanic",
    url: "https://huggingface.co/datasets/titanic"
  },

  // Code Datasets
  {
    id: "sahil2801/CodeAlpaca-20k",
    name: "Code Alpaca",
    description: "20k instruction-following data for code generation, covering various programming tasks",
    provider: "huggingface",
    category: "code",
    size: "11.2MB",
    format: ["parquet"],
    tags: ["code-generation", "instruction-following", "programming"],
    featured: false,
    downloads: 8900,
    likes: 145,
    task: "Code Generation",
    gated: false,
    lastModified: "2023-10-30",
    repository: "sahil2801/CodeAlpaca-20k",
    url: "https://huggingface.co/datasets/sahil2801/CodeAlpaca-20k"
  },

  // Multimodal Datasets
  {
    id: "google-research-datasets/conceptual_captions",
    name: "Conceptual Captions",
    description: "3.3M image-caption pairs extracted from billions of web pages for vision-language tasks",
    provider: "huggingface",
    category: "multimodal",
    size: "450MB",
    format: ["parquet"],
    tags: ["image-captioning", "vision-language", "web-scraping"],
    featured: false,
    downloads: 6500,
    likes: 123,
    task: "Image Captioning",
    gated: false,
    lastModified: "2023-09-25",
    repository: "google-research-datasets/conceptual_captions",
    url: "https://huggingface.co/datasets/google-research-datasets/conceptual_captions"
  },

  // Business/Finance
  {
    id: "financial_phrasebank",
    name: "Financial PhraseBank",
    description: "4.8k sentences from financial news categorized by sentiment (positive, negative, neutral)",
    provider: "huggingface",
    category: "finance",
    size: "498KB",
    format: ["parquet"],
    tags: ["sentiment-analysis", "finance", "news"],
    featured: false,
    downloads: 4200,
    likes: 78,
    task: "Sentiment Analysis",
    gated: false,
    lastModified: "2023-07-10",
    repository: "financial_phrasebank",
    url: "https://huggingface.co/datasets/financial_phrasebank"
  },

  // Science/Medical
  {
    id: "pubmed_qa",
    name: "PubMedQA",
    description: "273k biomedical question-answer pairs derived from PubMed abstracts for medical QA",
    provider: "huggingface",
    category: "medical",
    size: "156MB",
    format: ["parquet"],
    tags: ["question-answering", "medical", "biomedical"],
    featured: false,
    downloads: 3100,
    likes: 89,
    task: "Medical QA",
    gated: false,
    lastModified: "2023-08-20",
    repository: "pubmed_qa",
    url: "https://huggingface.co/datasets/pubmed_qa"
  },

  // Conversational AI
  {
    id: "daily_dialog",
    name: "DailyDialog",
    description: "13k multi-turn dialogues covering daily communication topics with emotion and act annotations",
    provider: "huggingface",
    category: "conversational",
    size: "7.9MB",
    format: ["parquet"],
    tags: ["dialogue", "conversation", "emotion"],
    featured: false,
    downloads: 5600,
    likes: 134,
    task: "Dialogue Generation",
    gated: false,
    lastModified: "2023-09-05",
    repository: "daily_dialog",
    url: "https://huggingface.co/datasets/daily_dialog"
  }
];

/**
 * Get datasets by category
 */
export const getHFDatasetsByCategory = (category: string) => {
  if (category === "all") return HUGGINGFACE_PUBLIC_DATASETS;
  return HUGGINGFACE_PUBLIC_DATASETS.filter(dataset => dataset.category === category);
};

/**
 * Get featured datasets
 */
export const getFeaturedHFDatasets = () => {
  return HUGGINGFACE_PUBLIC_DATASETS.filter(dataset => dataset.featured);
};

/**
 * Get datasets by task
 */
export const getHFDatasetsByTask = (task: string) => {
  return HUGGINGFACE_PUBLIC_DATASETS.filter(dataset => 
    dataset.task?.toLowerCase().includes(task.toLowerCase())
  );
};

/**
 * Search datasets by query
 */
export const searchHFDatasets = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return HUGGINGFACE_PUBLIC_DATASETS.filter(dataset =>
    dataset.name.toLowerCase().includes(lowercaseQuery) ||
    dataset.description.toLowerCase().includes(lowercaseQuery) ||
    dataset.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    (dataset.task && dataset.task.toLowerCase().includes(lowercaseQuery))
  );
};
export { S3_PUBLIC_DATASETS, GITHUB_PUBLIC_DATASETS };
