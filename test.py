from __future__ import print_function

import logging
import numpy as np
from optparse import OptionParser
import sys
from time import time
import matplotlib.pyplot as plt

from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.feature_selection import SelectFromModel
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.linear_model import RidgeClassifier
from sklearn.svm import LinearSVC
from sklearn.linear_model import SGDClassifier
from sklearn.linear_model import Perceptron
from sklearn.linear_model import PassiveAggressiveClassifier
from sklearn.naive_bayes import BernoulliNB, MultinomialNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neighbors import NearestCentroid
from sklearn.ensemble import RandomForestClassifier
from sklearn.utils.extmath import density
from sklearn import metrics

from sklearn.ensemble import VotingClassifier
from sklearn.pipeline import Pipeline

from sklearn.ensemble import AdaBoostClassifier

import random
from pymongo import MongoClient

# Display progress logs on stdout
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(message)s')


# parse commandline arguments
op = OptionParser()
op.add_option("--report",
              action="store_true", dest="print_report",
              help="Print a detailed classification report.")
op.add_option("--chi2_select",
              action="store", type="int", dest="select_chi2",
              help="Select some number of features using a chi-squared test")
op.add_option("--confusion_matrix",
              action="store_true", dest="print_cm",
              help="Print the confusion matrix.")
op.add_option("--top10",
              action="store_true", dest="print_top10",
              help="Print ten most discriminative terms per class"
                   " for every classifier.")
op.add_option("--all_categories",
              action="store_true", dest="all_categories",
              help="Whether to use all categories or not.")
op.add_option("--use_hashing",
              action="store_true",
              help="Use a hashing vectorizer.")
op.add_option("--n_features",
              action="store", type=int, default=2 ** 16,
              help="n_features when using the hashing vectorizer.")
op.add_option("--filtered",
              action="store_true",
              help="Remove newsgroup information that is easily overfit: "
                   "headers, signatures, and quoting.")


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

# Query real test data by classifier
real_test_queries = [db.articlePhraseChunkedTest.find({'classifier': classifier}) for classifier in real_target_names]

# Query fake test data by classifier
fake_test_queries = [db.articlePhraseChunkedTest.find({'classifier': classifier}) for classifier in fake_target_names]

# Format real test data, normalize classifier
real_test_data = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 0])
                                                                        for classifier in range(len(real_queries))
                                                                        for item in real_test_queries[classifier]
                                                                        for key in item if key == u'phraseChunks'])

# Format fake test data, normalize classifier
fake_test_data = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 1])
                                                                        for classifier in range(len(fake_queries))
                                                                        for item in fake_test_queries[classifier]
                                                                        for key in item if key == u'phraseChunks'])

# Made train and test variables using train and test samples
X_train = np.concatenate((real_data[:, 0], fake_data[:, 0]), axis=0)
y_train = np.concatenate((real_data[:, 1], fake_data[:, 1]), axis=0).tolist()
X_test = np.concatenate((real_test_data[:, 0], fake_test_data[:, 0]), axis=0)
y_test = np.concatenate((real_test_data[:, 1], fake_test_data[:, 1]), axis=0).tolist()

X_train_vote = X_train
y_train_vote = y_train
X_test_vote = X_test
y_test_vote = y_test 

# Required function for tokenizing and preprocessing data since it is a list, not raw text.
def getChunks(sample):
  for word in sample:
    yield word

print("Extracting features from the training data using a sparse vectorizer")
t0 = time()
if opts.use_hashing:
    vectorizer = HashingVectorizer(analyzer=getChunks, stop_words='english', alternate_sign=False,
                                   n_features=opts.n_features)
    X_train = vectorizer.transform(X_train)
else:
    vectorizer = TfidfVectorizer(analyzer=getChunks, sublinear_tf=True, use_idf=False, max_df=0.5)
    #vectorizer = CountVectorizer(analyzer=getChunks, min_df=1, max_df=6)
    #vectorizer = TfidfVectorizer(analyzer=getChunks, sublinear_tf=True, min_df=1, max_df=6)
    X_train = vectorizer.fit_transform(X_train)
duration = time() - t0
print("done in %fs" %  duration)
print("n_samples: %d, n_features: %d" % X_train.shape)
print()

print("Extracting features from the test data using the same vectorizer")
t0 = time()
X_test = vectorizer.transform(X_test)
duration = time() - t0
print("done in %fs" % duration)
print("n_samples: %d, n_features: %d" % X_test.shape)
print()

# mapping from integer feature name to original token string
if opts.use_hashing:
    feature_names = None
else:
    feature_names = vectorizer.get_feature_names()

if opts.select_chi2:
    print("Extracting %d best features by a chi-squared test" %
          opts.select_chi2)
    t0 = time()
    ch2 = SelectKBest(chi2, k=opts.select_chi2)
    X_train = ch2.fit_transform(X_train, y_train)
    X_test = ch2.transform(X_test)
    if feature_names:
        # keep selected feature names
        feature_names = [feature_names[i] for i
                         in ch2.get_support(indices=True)]
    print("done in %fs" % (time() - t0))
    print()

if feature_names:
    feature_names = np.asarray(feature_names)


def trim(s):
    """Trim string to fit on terminal (assuming 80-column display)"""
    return s if len(s) <= 80 else s[:77] + "..."


# #############################################################################
# Benchmark classifiers
def benchmark(clf):
    print('_' * 80)
    print("Training: ")
    print(clf)
    t0 = time()
    clf.fit(X_train, y_train)
    train_time = time() - t0
    print("train time: %0.3fs" % train_time)

    t0 = time()
    pred = clf.predict(X_test)
    test_time = time() - t0
    print("test time:  %0.3fs" % test_time)

    score = metrics.accuracy_score(y_test, pred)
    print("accuracy:   %0.3f" % score)

    if hasattr(clf, 'coef_'):
        print("dimensionality: %d" % clf.coef_.shape[1])
        print("density: %f" % density(clf.coef_))

        if opts.print_top10 and feature_names is not None:
            print("top 10 keywords per class:")
            for i, label in enumerate(target_names):
                top10 = np.argsort(clf.coef_[i])[-10:]
                print(trim("%s: %s" % (label, " ".join(feature_names[top10]))))
        print()

    if opts.print_report:
        print("classification report:")
        print(metrics.classification_report(y_test, pred,
                                            target_names=target_names))

    if opts.print_cm:
        print("confusion matrix:")
        print(metrics.confusion_matrix(y_test, pred))

    print()
    clf_descr = str(clf).split('(')[0]
    return clf_descr, score, train_time, test_time

# #############################################################################
# Benchmark classifiers
def benchmarkVote(clf):
    print('_' * 80)
    print("Training: ")
    print(clf)
    t0 = time()
    clf.fit(X_train_vote, y_train_vote)
    train_time = time() - t0
    print("train time: %0.3fs" % train_time)

    t0 = time()
    pred = clf.predict(X_test_vote)
    test_time = time() - t0
    print("test time:  %0.3fs" % test_time)

    score = metrics.accuracy_score(y_test_vote, pred)
    print("accuracy:   %0.3f" % score)

    if hasattr(clf, 'coef_'):
        print("dimensionality: %d" % clf.coef_.shape[1])
        print("density: %f" % density(clf.coef_))

    print()
    clf_descr = str(clf).split('(')[0]
    return clf_descr, score, train_time, test_time

results = []
for clf, name in (
        (RidgeClassifier(tol=1e-2, solver="lsqr"), "Ridge Classifier"),
        (Perceptron(max_iter=50, penalty='l1'), "Perceptron"),
        (PassiveAggressiveClassifier(max_iter=50), "Passive-Aggressive"),
        (KNeighborsClassifier(n_neighbors=10), "kNN"),
        (RandomForestClassifier(n_estimators=100), "Random forest")):
    print('=' * 80)
    print(name)
    results.append(benchmark(clf))

for penalty in ["l2", "l1"]:
    print('=' * 80)
    print("%s penalty" % penalty.upper())
    # Train Liblinear model
    results.append(benchmark(LinearSVC(penalty=penalty, dual=False,
                                       tol=1e-3)))

    # Train SGD model
    results.append(benchmark(SGDClassifier(alpha=.0001, max_iter=50,
                                           penalty=penalty)))

# Train SGD with Elastic Net penalty
print('=' * 80)
print("Elastic-Net penalty")
results.append(benchmark(SGDClassifier(alpha=.0001, max_iter=50,
                                       penalty="elasticnet")))

# Train NearestCentroid without threshold
print('=' * 80)
print("NearestCentroid (aka Rocchio classifier)")
results.append(benchmark(NearestCentroid()))

# Train sparse Naive Bayes classifiers
print('=' * 80)
print("Naive Bayes")
#results.append(benchmark(MultinomialNB(alpha=.01)))
results.append(benchmark(BernoulliNB(alpha=0.0128125)))

print('=' * 80)
print("Voting Classifier")
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
adaboost_pipe = Pipeline([
  ('tfidf', TfidfVectorizer(analyzer=getChunks, sublinear_tf=True, use_idf=False, max_df=0.5, stop_words='english')),
  ('ada', AdaBoostClassifier(n_estimators=100))
])
pipes = [
  ('ncc', centroid_pipe),
  ('bnb', bernoulli_pipe),
  ('sgd', sgd_pipe),
  ('pc', perceptron_pipe),
  ('ada', adaboost_pipe)
]

results.append(benchmarkVote(VotingClassifier(estimators=pipes, voting='hard')))

print('=' * 80)
print("AdaBoost")
results.append(benchmark(AdaBoostClassifier(n_estimators=100)))

# make some plots

indices = np.arange(len(results))

results = [[x[i] for x in results] for i in range(4)]

clf_names, score, training_time, test_time = results
training_time = np.array(training_time) / np.max(training_time)
test_time = np.array(test_time) / np.max(test_time)

plt.figure(figsize=(12, 8))
plt.title("Score")
plt.barh(indices, score, .2, label="score", color='navy')
plt.barh(indices + .3, training_time, .2, label="training time",
         color='c')
plt.barh(indices + .6, test_time, .2, label="test time", color='darkorange')
plt.yticks(())
plt.legend(loc='best')
plt.subplots_adjust(left=.25)
plt.subplots_adjust(top=.95)
plt.subplots_adjust(bottom=.05)

for i, c in zip(indices, clf_names):
    plt.text(-.3, i, c)

plt.show()