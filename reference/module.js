// Handle node, amd, and global systems
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = $rdf
  }
  exports.$rdf = $rdf
} else {
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return $rdf
    })
  }

  // Leak a global regardless of module system
  root['$rdf'] = $rdf
}
