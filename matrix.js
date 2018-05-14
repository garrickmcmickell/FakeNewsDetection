class AdjacencyMatrix {
  constructor(matrix) {
    this._matrix = matrix
  }

  matrix() {
    if(!this._matrix) {
      throw console.error('Unable to get matrix because it has not been created yet.');    
    }
    return this._matrix
  }

  static convertTreeToMatrix(tree) {  
    const mat = this._generateMatrix(tree.rootNode)
    this._fillMatrix(mat)
    this._fillMatrixNodes(tree.rootNode, mat)
    return new AdjacencyMatrix(mat)
  }
  
  static _generateMatrix(node, mat = {}) {
    mat[Object.keys(mat).length] = []
    node.children().forEach(child => { this._generateMatrix(child, mat) })
    return mat
  }
  
  static _fillMatrix(mat) {
    for(let row = 0; row < Object.keys(mat).length; row++)
      for(let rows = 0; rows < Object.keys(mat).length; rows++) 
        mat[row].push(0)
  }
  
  static _fillMatrixNodes(node, mat, row = -1) {  
    node.index = ++row
    node.children().forEach(child => { row = this._fillMatrixNodes(child, mat, row)})
    if(node.parent()) 
      mat[node.index][node.parent().index] = 1, mat[node.parent().index][node.index] = 1
    return row
  }
}

module.exports = AdjacencyMatrix