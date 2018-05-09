print(__doc__)

import sklearn
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pymongo import MongoClient 
from sklearn.feature_extraction import DictVectorizer
from sklearn.feature_selection import SelectPercentile, chi2
from sklearn import svm

#Connect to MongoDB
client = MongoClient(port=27017)
db = client.jsAppTest
coll = db.textData

#Query data and format
query = coll.find({})
X = []
for row in query:
    tempRow = {}
    for child in row:        
        if child != u'_id':
            tempRow[child.encode('ascii', 'ignore')] = row[child]      
    X.append(tempRow)

#Fill in empty data
df = pd.DataFrame(data=X)
df.fillna(0, inplace=True)

#Reformat
for i in range(len(X)):
    for row in df:
        tempRow = {}
        X[i][row] = df[row][i]
        
#Vectorize data and extract features
vec = DictVectorizer()
X = vec.fit_transform(X).toarray()
y = np.arange(X.shape[0], dtype=np.int32)

#Select features
selector = SelectPercentile(chi2, percentile=10)
selector.fit(X, y)

#SVM classification
clf = svm.SVC(kernel='linear')
clf.fit(X, y)
clf_selected = svm.SVC(kernel='linear')
clf_selected.fit(selector.transform(X), y)

#Calculate weights
scores = -np.log10(selector.pvalues_)
scores /= scores.max()
svm_weights = (clf.coef_ ** 2).sum(axis=0)
svm_weights /= svm_weights.max()
svm_weights_selected = (clf_selected.coef_ ** 2).sum(axis=0)
svm_weights_selected /= svm_weights_selected.max()

#Plot data
plt.figure(1)
plt.clf()
X_indices = np.arange(X.shape[-1])
plt.bar(X_indices - .45, scores, width=.2, label=r'Univariate score ($-Log(p_{value})$)', color='darkorange', edgecolor='black')
plt.bar(X_indices - .25, svm_weights, width=.2, label='SVM weight', color='navy', edgecolor='black')
plt.bar(X_indices[selector.get_support()] - .05, svm_weights_selected, width=.2, label='SVM weights after selection', color='c', edgecolor='black')
plt.title("Comparing feature selection")
plt.xlabel('Feature number')
plt.yticks(())
plt.axis('tight')
plt.legend(loc='upper right')
plt.show()


