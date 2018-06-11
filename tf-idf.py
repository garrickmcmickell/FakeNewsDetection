from __future__ import print_function

import logging
import random
import numpy as np
import pandas as pd
from optparse import OptionParser
import sys

from pymongo import MongoClient

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import BernoulliNB, MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import SGDClassifier
from sklearn.linear_model import Perceptron
from sklearn.utils.extmath import density
from sklearn import metrics


# Display progress logs on stdout
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(message)s')

# parse commandline arguments
op = OptionParser()
op.add_option('--random',
              action='store', type='int', dest='num_samples',
              help='Select n random test samples from each data set.')

def is_interactive():
    return not hasattr(sys.modules['__main__'], '__file__')

# work-around for Jupyter notebook and IPython console
argv = [] if is_interactive() else sys.argv[1:]
(opts, args) = op.parse_args(argv)
if len(args) > 0:
    op.error("this script takes no arguments.")
    sys.exit(1)

print(__doc__)
op.print_help()
print()

# Required function for tokenizing and preprocessing data since it is a list, not raw text.
def getChunks(sample):
  for word in sample:
    yield word

# #############################################################################
# Query data

# Names of classifiers saved to array for retreival, normalization, and idendification after normalization
classifiers = ['straight', 'potential_bias', 'probable_bias', 'editorial', 'cherry', 'fake', 'satire']
real_target_names = ['straight', 'potential_bias', 'probable_bias', 'editorial', 'cherry']
fake_target_names = ['fake', 'satire']
target_names = ['real', 'fake']

# Connect to MongoDB
client = MongoClient(port=27017)
db = client.classifiedArticles

# Query real data by classifier
real_queries = [db.articlePhraseChunked.find({'classifier': classifier}) for classifier in real_target_names]

# Query fake data by classifier
fake_queries = [db.articlePhraseChunked.find({'classifier': classifier}) for classifier in fake_target_names]

# Format real data, normalize classifier
real_data = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 0])
                                                                        for classifier in range(len(real_queries))
                                                                        for item in real_queries[classifier]
                                                                        for key in item if key == u'phraseChunks'])

# Format fake data, normalize classifier
fake_data = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 1])
                                                                        for classifier in range(len(fake_queries))
                                                                        for item in fake_queries[classifier]
                                                                        for key in item if key == u'phraseChunks'])

# #############################################################################
# Function for getting sample data

def getData():
  # Get 5 random samples from each data set
  test_indicies_real = random.sample(range(0, real_data.shape[0]), 5)
  test_real = np.array([real_data[index] for index in test_indicies_real])
  test_indicies_fake = random.sample(range(0, fake_data.shape[0]), 5)
  test_fake = np.array([fake_data[index] for index in test_indicies_fake])

  # Set train samples as data retrieved without test samples
  train_real = np.delete(real_data, test_indicies_real, 0)
  train_fake = np.delete(fake_data, test_indicies_fake, 0)

  # Made train and test variables using train and test samples
  X_train = np.concatenate((train_real[:, 0], train_fake[:, 0]), axis=0)
  y_train = np.concatenate((train_real[:, 1], train_fake[:, 1]), axis=0).tolist()
  X_test = np.concatenate((test_real[:, 0], test_fake[:, 0]), axis=0)
  y_test = np.concatenate((test_real[:, 1], test_fake[:, 1]), axis=0).tolist()

  # Return sample data
  return X_train, y_train, X_test, y_test

# #############################################################################
# Funtion to vectorize data

def vectorize(X_train, X_test):
  # Create vectorizer
  vectorizer = TfidfVectorizer(analyzer=getChunks, sublinear_tf=True, max_df=0.2, stop_words='english')

  # Fit/tranform train data and transform test data
  X_train = vectorizer.fit_transform(X_train)
  X_test = vectorizer.transform(X_test)

  # Return vectorized data
  return X_train, X_test

# #############################################################################
# Function to benchmark classifiers

def benchmark(clf, X_train, y_train, X_test, y_test):
  clf.fit(X_train, y_train)
  pred = clf.predict(X_test)

  score = metrics.accuracy_score(y_test, pred)

  return score

# #############################################################################

results = []

for i in range(100):
  # Get a new set of data
  X_train, y_train, X_test, y_test = getData()

  # Vectorize the new data
  X_train, X_test = vectorize(X_train, X_test)

  # Run data through classifiers
  predictions = np.array([benchmark(clf, X_train, y_train, X_test, y_test) for clf in (MultinomialNB(alpha=.01),
                                                                                       BernoulliNB(alpha=0.0128125),
                                                                                       SGDClassifier(alpha=.0001, max_iter=50, penalty='l1'),
                                                                                       Perceptron(max_iter=50),
                                                                                       RandomForestClassifier(n_estimators=100))])
  
  results.append(predictions)

  print('Test %i of 100 Complete.' % (i + 1))

results = np.array(results)
results = pd.DataFrame({'MultiNB':  results[:, 0],
                        'BernNB':   results[:, 1],
                        'SGD':      results[:, 2],
                        'Percept':  results[:, 3],
                        'RandFrst': results[:, 4]})

results.to_excel('classifierResults4.xlsx', sheet_name='sheet1', index=False)