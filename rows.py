print(__doc__)

import sklearn
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pymongo import MongoClient
from sklearn.ensemble import IsolationForest

def getlongest(l):
    if(not isinstance(l, list)): return(0)
    return(max([len(l),] + [len(subl) for subl in l if isinstance(subl, list)] +
        [getlongest(subl) for subl in l]))

client = MongoClient(port=27017)
db = client.jsAppTest
coll = db.rows

query = db.rows.find({})
X_train = [item[u'parent'] for item in query]

query = db.fakeRows.find({})
X_test = [item[u'parent'] for item in query]

longest = getlongest(X_train)

for arr in X_train:
  if len(arr) == longest:
    highest = max(arr)
  while len(arr) < longest:
    arr.append(0)

X_train = np.vstack(np.array(arr) for arr in X_train)

for arr in X_test:
  while len(arr) < longest:
    arr.append(0)

X_test = np.vstack(np.array(arr) for arr in X_test)

clf = IsolationForest()
clf.fit(X_train)
y_pred_train = clf.predict(X_train)
y_pred_test = clf.predict(X_test)
y_pred_test_outliers = np.array([X_test[i] for i in range(len(y_pred_test)) if y_pred_test[i] != 1])

plt.title("IsolationForest")
b1 = [plt.scatter(np.arange(X_train.shape[1]), X_train[i], c='blue', s=.5,) for i in range(len(X_train))]
b2 = [plt.scatter(np.arange(X_test.shape[1]), X_test[i] + .25, c='green', s=.5,) for i in range(len(X_test))]
b3 = [plt.scatter(np.arange(y_pred_test_outliers.shape[1]) +.5, y_pred_test_outliers[i], c='red', s=.5,) for i in range(len(y_pred_test_outliers))]
plt.show()          

