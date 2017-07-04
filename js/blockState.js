/**
 * @private
 * @class
 * @param {Block} block
 */
function BlockState(block) {
    /**
     * @private
     * @member {Block}
     */
    this._block = block;
    /**
     * @private
     * @member {FlowGraph}
     */
    this._graph = block._graph;
};