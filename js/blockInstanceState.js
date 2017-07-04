/**
 * @private
 * @class
 * @param {Block} block
 */
function BlockInstanceState(block) {
    /*
     * Call parent constructor.
     */
    BlockState.call(this, block);
}


/*
 * Inherit BlockState class.
 */
BlockInstanceState.prototype = Object.create(BlockState.prototype);


/**
 * Block drag event handler.
 * @public
 * @param {Object} data
 * @param {Integer} index
 */
BlockInstanceState.prototype.dragStartEventHandler = function(data, index) {

    this._graph._draggedBlock = this._block;
};


/**
 * Block drag event handler.
 * @public
 * @param {Object} data
 * @param {Integer} index
 */
BlockInstanceState.prototype.dragEventHandler = function(data, index) {

    this._graph._draggedBlock.setPosition([d3.event.x, d3.event.y]);
};


/**
 * Block drag end event handler.
 * @public
 * @param {Object} data
 * @param {Integer} index
 */
BlockInstanceState.prototype.dragEndEventHandler = function(data, index) {

}