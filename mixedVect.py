import random
from time import time

import numpy as np
import pandas as pd
from pymongo import MongoClient

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import BernoulliNB
from sklearn.linear_model import SGDClassifier
from sklearn.linear_model import Perceptron
from sklearn.neighbors import NearestCentroid
from sklearn.ensemble import VotingClassifier
from sklearn.pipeline import Pipeline
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.utils.extmath import density
from sklearn import metrics

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
print('Querying real train data')
t0 = time()
real_queries = [db.articlePhraseChunked.find({'classifier': classifier}) for classifier in real_target_names]
duration = time() - t0
print("done in %fs" %  duration)

# Query fake data by classifier
print('Querying fake train data')
t0 = time()
fake_queries = [db.articlePhraseChunked.find({'classifier': classifier}) for classifier in fake_target_names]
duration = time() - t0
print("done in %fs" %  duration)

# Format real data, normalize classifier
print('Formatting real train data')
t0 = time()
real_data = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 0])
                                                                        for classifier in range(len(real_queries))
                                                                        for item in real_queries[classifier]
                                                                        for key in item if key == u'phraseChunks'])
duration = time() - t0
print("done in %fs" %  duration)

# Format fake data, normalize classifier
print('Formatting fake train data')
t0 = time()
fake_data = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 1])
                                                                        for classifier in range(len(fake_queries))
                                                                        for item in fake_queries[classifier]
                                                                        for key in item if key == u'phraseChunks'])
duration = time() - t0
print("done in %fs" %  duration)

# Query real test data by classifier
print('Querying real test data')
t0 = time()
real_test_queries = [db.articlePhraseChunkedTest.find({'classifier': classifier}) for classifier in real_target_names]
duration = time() - t0
print("done in %fs" %  duration)

# Query fake test data by classifier
print('Querying fake test data')
t0 = time()
fake_test_queries = [db.articlePhraseChunkedTest.find({'classifier': classifier}) for classifier in fake_target_names]
duration = time() - t0
print("done in %fs" %  duration)

# Format real test data, normalize classifier
print('Formatting real test data')
t0 = time()
real_test_data = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 0])
                                                                        for classifier in range(len(real_queries))
                                                                        for item in real_test_queries[classifier]
                                                                        for key in item if key == u'phraseChunks'])
duration = time() - t0
print("done in %fs" %  duration)

# Format fake test data, normalize classifier
print('Formatting fake test data')
t0 = time()
fake_test_data = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 1])
                                                                        for classifier in range(len(fake_queries))
                                                                        for item in fake_test_queries[classifier]
                                                                        for key in item if key == u'phraseChunks'])
duration = time() - t0
print("done in %fs" %  duration)

X_train = np.concatenate((real_data[:, 0], fake_data[:, 0]), axis=0)
y_train = np.concatenate((real_data[:, 1], fake_data[:, 1]), axis=0).tolist()

# #############################################################################
# Make classifiers

centroid_pipe = Pipeline([
  ('cv', CountVectorizer(analyzer=getChunks, min_df=1, max_df=6)),
  ('ncc', NearestCentroid())
])
bernoulli_pipe = Pipeline([
  ('cv', CountVectorizer(analyzer=getChunks, min_df=1, max_df=6)),
  ('bnb', BernoulliNB(alpha=0.0128125))
])
sgd_pipe = Pipeline([
  ('tfidf', TfidfVectorizer(analyzer=getChunks, sublinear_tf=True, use_idf=False, max_df=0.5, stop_words='english')),
  ('sgd', SGDClassifier(alpha=.0001, max_iter=50, penalty='l1'))
])
perceptron_pipe = Pipeline([
  ('tfidf', TfidfVectorizer(analyzer=getChunks, sublinear_tf=True, use_idf=False, max_df=0.5, stop_words='english')),
  ('pc', Perceptron(max_iter=50, penalty='l1'))
])
randomforest_pipe = Pipeline([
  ('cv', CountVectorizer(analyzer=getChunks)),
  ('rfc', RandomForestClassifier(n_estimators=100))
])
knn_pipeline = Pipeline([
  ('cv', CountVectorizer(analyzer=getChunks)),
  ('knn', KNeighborsClassifier(n_neighbors=10))
])

pipes = [
  ('ncc', centroid_pipe),
  ('bnb', bernoulli_pipe),
  ('sgd', sgd_pipe),
  ('pc', perceptron_pipe),
  ('rfc', randomforest_pipe),
  ('knn', knn_pipeline)
]

pipes2 = [
  ('ncc', centroid_pipe),
  ('sgd', sgd_pipe),
  ('pc', perceptron_pipe),
  ('rfc', randomforest_pipe),
  ('knn', knn_pipeline)
]

clfs = [
  (centroid_pipe, 'Nearest Centroid Pipeline'),
  (bernoulli_pipe, 'BernouliNB Pipeline'),
  (sgd_pipe, 'SGD L1 Pipeline'),
  (perceptron_pipe, 'Perceptron Pipeline'),
  (randomforest_pipe, 'Random Forest Pipeline'),
  (knn_pipeline, 'KNN Pipeline'),
  (VotingClassifier(estimators=pipes, voting='hard'), 'Voting Classifier w/ BNB'),
  (VotingClassifier(estimators=pipes2, voting='hard'), 'Voting Classifier w/o BNB')
]

# #############################################################################
# Function for getting sample data

def getTestData():
  # Get 5 random samples from each test data set
  test_indicies_real = random.sample(range(0, real_test_data.shape[0]), 5)
  test_real = np.array([real_test_data[index] for index in test_indicies_real])
  test_indicies_fake = random.sample(range(0, fake_test_data.shape[0]), 5)
  test_fake = np.array([fake_test_data[index] for index in test_indicies_fake])

  # Make test variables using test samples

  X_test = np.concatenate((test_real[:, 0], test_fake[:, 0]), axis=0)
  y_test = np.concatenate((test_real[:, 1], test_fake[:, 1]), axis=0).tolist()

  # Return sample data
  return X_test, y_test

# #############################################################################
# Function to benchmark classifiers

def benchmark(clf, name, X_test, y_test):
  print('Testing: ' + name)
  print('Fitting data')
  t_0 = time()
  clf.fit(X_train, y_train)
  duration = time() - t_0
  print("done in %fs" %  duration)

  print('Predicting labels')
  t_0 = time()
  pred = clf.predict(X_test)
  duration = time() - t_0
  print("done in %fs" %  duration)

  score = metrics.accuracy_score(y_test, pred)
  print('Accuracy: ' + str(score))

  return score

# #############################################################################

results = []

for i in range(100):
  print('_' * 80)
  print('Starting test %i of 100' % (i + 1))
  t0 = time()
  # Get a new set of data
  X_test, y_test = getTestData()

  # Run data through classifiers
  predictions = np.array([benchmark(clf, name, X_test, y_test) for clf, name in clfs])
  
  results.append(predictions)

  duration = time() - t0
  print('Test %i of 100 Complete in %f.' % ((i + 1), duration))

results = np.array(results)
results = pd.DataFrame({'ncc_pipe':      results[:, 0],
                        'bnb_pipe':      results[:, 1],
                        'sgd_pipe':      results[:, 2],
                        'pc_pipe':       results[:, 3],
                        'rfc_pipe':      results[:, 4],
                        'knn_pipe':      results[:, 5],
                        'voting_bnb':    results[:, 6],
                        'voting_no_bnb': results[:, 6]})

results.to_excel('classifierResults5.xlsx', sheet_name='sheet1', index=False)
