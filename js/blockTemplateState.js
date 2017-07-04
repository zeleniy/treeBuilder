/**
 * @private
 * @class
 * @param {Block} block
 */
function BlockTemplateState(block) {
    /*
     * Call parent constructor.
     */
    BlockState.call(this, block);
}


/*
 * Inherit BlockState class.
 */
BlockTemplateState.prototype = Object.create(BlockState.prototype);


/**
 * Block drag start event handler.
 * @public
 * @param {Object} data
 * @param {Integer} index
 */
BlockTemplateState.prototype.dragStartEventHandler = function(data, index) {
    /*
     * Clone input data to prevent sharing single data set between multiple block's instances.
     */
    data = JSON.parse(JSON.stringify(data));
    /*
     * Create instance like/upgraded template.
     */
    this._graph._draggedBlock = Block.getInstance(this._graph, this._graph._blockWidth, this._graph._blockHeight)
        .setId(this._graph._counter ++)
        .setData(data, index)
        .setOffset(this._graph._blockOffset, 0)
        .render(this._graph._blocksCanvas)
        .setPosition(this._block.getPosition())
        .upgrade();
};


/**
 * Block drag event handler.
 * @public
 * @param {Object} data
 * @param {Integer} index
 */
BlockTemplateState.prototype.dragEventHandler = function(data, index) {

    var container = this._graph._draggedBlock.getContainer();

    if (d3.event.x <= this._graph._leftSideWidth) {
        container.style('fill', 'lightblue');
    } else {
        container.style('fill', 'white');
    }

    this._graph._draggedBlock.setPosition([d3.event.x, d3.event.y]);
};


/**
 * Block drag end event handler.
 * @public
 * @param {Object} data
 * @param {Integer} index
 */
BlockTemplateState.prototype.dragEndEventHandler = function(data, index) {
    /*
     * If block within left side - remove it and that's all.
     */
    if (d3.event.x <= this._graph._leftSideWidth) {
        return this._graph._removeBlock(this._graph._draggedBlock, index);
    }
    /*
     * Register block as installed in viewport.
     */
    this._graph._registerBlock(this._graph._draggedBlock);
    /*
     * Remove block markdown from current container g.blocks-canvas.
     */
    var html = this._graph._draggedBlock.getContainer().remove().node();
    /*
     * Append detached markdown into new container g.graph-canvas
     * See http://stackoverflow.com/a/23724356/1191125
     */
    this._graph._graphCanvas.append(function() {
        return html;
    });
    /*
     * Get block position.
     */
    var position = this._graph._draggedBlock.getPosition();
    /*
     * Get viewport transformation.
     */
    var transform = this._graph.getViewportTransform();
    /*
     * Fix position depending on g.graph-canvas translate and scale/zoom.
     */
    position[0] = (position[0] - transform.x) / transform.k;
    position[1] = (position[1] - transform.y) / transform.k;
    /*
     * Set corrected position back.
     */
    this._graph._draggedBlock.setPosition(position);
    /*
     * Update block state.
     */
    this._graph._draggedBlock._state = new BlockInstanceState(this._graph._draggedBlock);
};