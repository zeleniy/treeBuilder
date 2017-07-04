/**
 * @public
 * @class
 * @param {FlowGraph} graph
 * @param {Number} width
 * @param {Number} height
 */
function Block(graph, width, height) {
    /**
     * @private
     * @member {FlowGraph}
     */
    this._graph = graph;
    /**
     * @private
     * @member {Number}
     */
    this._width = width;
    /**
     * @private
     * @member {Number}
     */
    this._height = height;
    /**
     * @private
     * @member {BlockState}
     */
    this._state = new BlockTemplateState(this);
    /**
     * Block container.
     * @private
     * @member {d3.selection}
     */
    this._container = undefined;
    /**
     * Block delete button.
     * @private
     * @member {d3.selection}
     */
    this._button = undefined;
    /**
     * @private
     * @member {d3.selection}
     */
    this._input = undefined;
    /**
     * @private
     * @member {d3.selection}
     */
    this._output = undefined;
    /**
     * Unique id.
     * @private
     * @member {Integer}
     */
    this._id;
    /**
     * Block coordinates.
     * @private
     * @member {Number[]}
     */
    this._position = [];
}


/**
 * @public
 * @static
 * @param {FlowGraph} graph
 * @param {Number} width
 * @param {Number} height
 * @returns {Block}
 */
Block.getInstance = function(graph, width, height) {

    return new Block(graph, width, height);
};


/**
 * Set block property.
 * @public
 * @param {String} name
 * @param {Mixed} value
 */
Block.prototype.setValue = function(name, value) {

    this._data.Data[name] = value;
};


/**
 * Get block property.
 * @public
 * @param {String} name
 * @param {Mixed} value
 */
Block.prototype.getValue = function(name) {

    return this._data.Data[name];
};


/**
 * Convert block to JSON.
 * @public
 * @returns {Object}
 */
Block.prototype.toJson = function() {

    return {
        'id' : this._id,
        'index' : this._index,
        'position' : this._position,
        'data' : this._data
    };
};


/**
 * Set block offset.
 * @param {Number} offset
 * @returns {Block}
 */
Block.prototype.setOffset = function(offset) {

    this._offset = offset;
    return this;
};


/**
 * Set block unique id.
 * @param {Integer} id
 * @returns {Block}
 */
Block.prototype.setId = function(id) {

    this._id = id;
    return this;
};


/**
 * Get block unique id.
 * @returns {Integer}
 */
Block.prototype.getId = function() {

    return this._id;
};


/**
 * Set block data.
 * @param {Object} data
 * @param {Integer} i - sequence number on side bar.
 * @returns {Block}
 */
Block.prototype.setData = function(data, i) {

    this._data = data;
    this._index = i;

    return this;
};


/**
 * Get block SVG markdown.
 * @public
 * @returns {d3.selection}
 */
Block.prototype.getContainer = function() {

    return this._container;
};


/**
 * @public
 * @returns {d3.selection}
 */
Block.prototype.getInput = function() {

    return this._input;
};


/**
 * @public
 * @returns {d3.selection}
 */
Block.prototype.getOutput = function() {

    return this._output;
};


/**
 * Upgrade block.
 * @param {Boolean} [upgradeState]
 * @returns {Block}
 */
Block.prototype.upgrade = function(upgradeState) {
    /*
     * Stash reference to this object.
     */
    var self = this;
    /*
     * Increase block size values.
     */
    this._width = this._width * 1.2;
    this._height = this._height * 1.2;
    /*
     * Change container CSS class.
     */
    this._container.classed('instance', true)
        .classed('template', false)
        .on('mouseover', function() {
            self._button.style('display', 'block');
        }).on('mouseout', function() {
            self._button.style('display', null);
        });
    /*
     * Increase block size.
     */
    this._rect.transition()
        .duration(250)
        .attr('width', this._width)
        .attr('height', this._height)
        .attr('rx', this._height / 2);
    /*
     * Move block title according with new size.
     */
    this._title.transition()
        .duration(250)
        .attr('x', this._width / 2)
        .attr('y', this._height / 2 * 1.2);
    /*
     * Append delete button container.
     */
    this._button = this._container.append('g')
        .attr('class', 'block-remove-button')
        .attr('transform', 'translate(' + (this._width - 10) + ', 0)')
        .on('click', function() {
            /*
             * Remove block.
             */
            self.remove();
            /*
             * Stop event propagation.
             */
            d3.event.stopPropagation();
        });
    /*
     * Append button's circle.
     */
    this._button.append('circle')
        .attr('r', 10);
    /*
     * Append cross.
     */
    this._button.selectAll('line')
        .data([1, 3])
        .enter()
        .append('line')
        .attr('x1', -6)
        .attr('y1', 0)
        .attr('x2', 6)
        .attr('y2', 0)
        .attr('transform', function(d) {
            return 'rotate(' + d * 45 + ')';
        });
    /*
     * Append connectors.
     */
    this._container.append('rect')
        .datum(this._id)
        .attr('class', 'socket')
        .attr('x', this._width / 2 - 10)
        .attr('y', -6)
        .attr('width', 20)
        .attr('height', 12)
        .attr('rx', 6);
    this._container.insert('rect', ':first-child')
        .datum(this._id)
        .attr('class', 'socket-area')
        .attr('x', this._width / 2 - 25)
        .attr('y', -15)
        .attr('width', 50)
        .attr('height', 30)
        .attr('rx', 15);
    this._output = this._container.append('rect')
        .attr('class', 'socket')
        .attr('x', this._width / 2 - 10)
        .attr('y', this._height - 6)
        .attr('width', 20)
        .attr('height', 12)
        .attr('rx', 6)
        .call(d3.drag()
            .on('start', function(d) {
                self._arrow = Arrow.getInstance(self._graph).appendTo(self);
            }).on('drag', function(d) {
                self._arrow.drag();
            }).on('end', function(d) {
                self._arrow.connectTo();
            })
        );

    if (upgradeState) {
        this._state = new BlockInstanceState(this);
    }

    return this;
};


/**
 * Get block position.
 * @returns {Number[]}
 */
Block.prototype.getPosition = function() {

    return this._position;
};


/**
 * Get block's input point position.
 * @returns {Number[]}
 */
Block.prototype.getInputPosition = function() {

    return [
        this._position[0] + this._width / 2,
        this._position[1] - 6
    ];
};


/**
 * Get block's output point position.
 * @returns {Number[]}
 */
Block.prototype.getOutputPosition = function() {

    return [
        this._position[0] + this._width / 2,
        this._position[1] + this._height + 6
    ];
};


/**
 * Get mouse position.
 * Returns mouse coordinates when arrow dragged.
 * @returns {Number}
 */
Block.prototype.getMousePosition = function() {

    return [
        this._position[0] + d3.event.x,
        this._position[1] + d3.event.y
    ];
};


/**
 * @public
 * @param {Number[]} position
 * @returns {Block}
 */
Block.prototype.setPosition = function(position) {
    /*
     * Stash coordinates.
     */
    this._position = position;
    /*
     * Apply coordinates.
     */
    this._container.attr('transform', 'translate(' + this._position + ')');
    /*
     * Update arrows coordinates.
     */
    this._graph.getBlockArrows(this).forEach(function(arrow) {
        arrow.update();
    });

    return this;
};


/**
 * Remove block.
 * @public
 */
Block.prototype.remove = function() {
    /*
     * Remove block container.
     */
    this._container.remove();
    /*
     * Remove arrows.
     */
    this._graph.getBlockArrows(this).forEach(function(arrow) {
        arrow.remove();
    });
    /*
     * Clear right side if block displayed.
     */
    this._graph.clearRightSide(this);
    /*
     * Remove block from graph.
     */
    this._graph.removeBlock(this);
};


/**
 * Render block.
 * @public
 * @param {d3.selection} svg
 * @prama {Number} scale
 * @returns {Block}
 */
Block.prototype.render = function(svg, scale) {
    /*
     * Stash reference to this object.
     */
    var self = this;
    /*
     * Append block container and set drag behaviour.
     */
    this._container = svg.append('g')
        .datum(this._data)
        .attr('class', 'block')
        .on('click', function(d) {
            /*
             * Show block data.
             */
            self._graph.displayBlockData(self);
            /*
             * Stop event propagation.
             */
            d3.event.stopPropagation();
        }).call(d3.drag()
             /*
              * Set block original coordinates.
              * See http://stackoverflow.com/questions/15966256/how-to-set-the-origin-drag-origin-for-drag-behavior-in-d3-javascript-library
              * See http://stackoverflow.com/questions/38650637/how-to-set-the-origin-while-drag-in-d3-js-in-v4
              */
            .subject(function() { 
                return {
                    x: self._position[0],
                    y: self._position[1]
                };
            }).on('start', function(d) {
                return self._state.dragStartEventHandler(d, self._index);
            }).on('drag', function(d) {
                return self._state.dragEventHandler(d, self._index);
            }).on('end', function(d) {
                return self._state.dragEndEventHandler(d, self._index);
            })
        );
    /*
     * Append block main rectangle.
     */
    this._rect = this._container.append('rect')
        .attr('class', 'template')
        .attr('width', this._width)
        .attr('height', this._height)
        .attr('rx', this._height / 2);
    /*
     * Append block text.
     */
    this._title = this._container.append('text')
        .attr('x', this._width / 2)
        .attr('y', this._height / 2 * 1.2)
        .text(function(d) {
            return d.Type;
        });

    return this;
};