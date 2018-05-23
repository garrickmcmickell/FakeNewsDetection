import numpy as np
from time import time
import matplotlib.pyplot as plt
from pymongo import MongoClient
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import RandomizedSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer

# Required function for tokenizing and preprocessing data since it is a list, not raw text
def getChunks(sample):
  for word in sample:
    yield word

#Connect to MongoDB
client = MongoClient(port=27017)
db = client.phraseChunk

#Query and format training data for real samples
train_real = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 0])
                      for query in [db['train' + str(i + 1)].find({}) if i != 0 else db.train.find({}) for i in range(4)]
                      for item in query
                      for key in item if key != u'_id'])

#Query and format training data for fake samples
train_fake = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 1])
                      for query in [db['train' + str(i + 5)].find({}) for i in range(5)]
                      for item in query
                      for key in item if key != u'_id'])

#Query and format test data for fake samples
test_real = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 0])
                      for item in db.test1.find({}) 
                      for key in item if key != u'_id'])

#Query and format test data for fake samples
test_fake = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 1])
                      for item in db.test2.find({}) 
                      for key in item if key != u'_id'])

#Made train and test variables
X_train = np.concatenate((train_real[:, 0], train_fake[:, 0]), axis=0)
y_train = np.concatenate((train_real[:, 1], train_fake[:, 1]), axis=0).tolist()
X_test = np.concatenate((test_real[:, 0], test_fake[:, 0]), axis=0)
y_test = np.concatenate((test_real[:, 1], test_fake[:, 1]), axis=0).tolist()

#Fit and transform data
vec = TfidfVectorizer(analyzer=getChunks, norm='l2', max_features=2125, sublinear_tf=True, max_df=0.625)
X_train = vec.fit_transform(X_train)
X_test = vec.transform(X_test)

# #############################################################################

#Utility function to report best scores
def report(results, n_top=3):
    for i in range(1, n_top + 1):
        candidates = np.flatnonzero(results['rank_test_score'] == i)
        for candidate in candidates:
            print("Model with rank: {0}".format(i))
            print("Mean validation score: {0:.3f} (std: {1:.3f})".format(
                  results['mean_test_score'][candidate],
                  results['std_test_score'][candidate]))
            print("Parameters: {0}".format(results['params'][candidate]))
            print("")

clf = LogisticRegression(penalty='l1', dual=False, tol=1e-3, solver='saga', C=0.625)

parameters = {
    'solver' : (['liblinear', 'saga']),
    'tol': ([1e-2, 1e-3, 1e-4, 1e-5]),
    'intercept_scaling': (0.5, 0.75, 1, 1.25, 1.5),
    'C': ([0.5, 0.625, 0.75, 0.875, 1]),
    'max_iter': ([50, 75, 100, 125, 150]),
}

# run randomized search
n_iter_search = 5
random_search = RandomizedSearchCV(clf, param_distributions=parameters,
                                  n_iter=n_iter_search, refit=True)

start = time()
random_search.fit(X_train, y_train)
print("RandomizedSearchCV took %.2f seconds for %d candidates"
      " parameter settings." % ((time() - start), n_iter_search))
report(random_search.cv_results_)
print ''
