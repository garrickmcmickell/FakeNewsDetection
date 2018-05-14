print(__doc__)

import json
import codecs
import sklearn
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pymongo import MongoClient 
from sklearn.feature_extraction import DictVectorizer
from sklearn.ensemble import IsolationForest

#Connect to MongoDB
client = MongoClient(port=27017)
db = client.jsAppTest
coll = db.textData

#Query matrix data and format
#query = db.matrix.find({})
#mats = [{int(row): json.loads(codecs.decode(item[key]))[row] for row in json.loads(codecs.decode(item[key]))} for item in query for key in item if key != u'_id']
                
#Query training data and format
query = db.textData.find({})
X_train = [{child.encode('ascii', 'ignore'): row[child] for child in row if child != u'_id'} for row in query]

#Query test data and format
query = db.fakeNews.find({})
X_test = [{child.encode('ascii', 'ignore'): row[child] for child in row if child != u'_id'} for row in query]

#Fill in empty training data
df_train = pd.DataFrame(data=X_train)
df_train.fillna(0, inplace=True)

#Fill in empty test data
df_test = pd.DataFrame(data=X_test)
df_test.fillna(0, inplace=True)

dtype_train_dict = {df_train.dtypes.index[i]: df_train.dtypes[i] for i in range(len(df_train.dtypes))}
dtype_test_dict = {df_test.dtypes.index[i]: df_test.dtypes[i] for i in range(len(df_test.dtypes))}
dtype_mask = dict(dtype_test_dict, **dtype_train_dict)

#Add missing series to training and test data
for key in dtype_mask:
    if key not in dtype_train_dict:
        df_train[key] = pd.Series(data=np.zeros(df_train.shape[0]), index=np.arange(df_train.shape[0]), name=key, dtype=dtype_mask[key])
    if key not in dtype_test_dict:
        df_test[key] = pd.Series(data=np.zeros(df_test.shape[0]), index=np.arange(df_test.shape[0]), name=key, dtype=dtype_mask[key]) 

#Reformat training data
for i in range(len(X_train)):
    for row in df_train:
        X_train[i][row] = df_train[row][i]

#Reformat test data
for i in range(len(X_test)):
    for row in df_test:
        X_test[i][row] = df_test[row][i]
        
#Vectorize data and extract features
vec_train = DictVectorizer()
X_train = vec_train.fit_transform(X_train).toarray()
        
#Vectorize data and extract features
vec_test = DictVectorizer()
X_test = vec_test.fit_transform(X_test).toarray()

#Train and test data
clf = IsolationForest()
clf.fit(X_train)
y_pred_train = clf.predict(X_train)
y_pred_test = clf.predict(X_test)
y_pred_test_outliers = np.array([X_test[i] for i in range(len(y_pred_test)) if y_pred_test[i] != 1])

#Plot data
plt.title("IsolationForest")
b1 = [plt.scatter(np.arange(X_train.shape[1]), X_train[i], c='blue', s=.5,) for i in range(len(X_train))]
b2 = [plt.scatter(np.arange(X_test.shape[1]), X_test[i] + .25, c='green', s=.5,) for i in range(len(X_test))]
b3 = [plt.scatter(np.arange(y_pred_test_outliers.shape[1]) +.5, y_pred_test_outliers[i], c='red', s=.5,) for i in range(len(y_pred_test_outliers))]
plt.show()
