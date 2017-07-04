/**
 * @public
 * @class
 * @param {FlowGraph} graph
 */
function Arrow(graph) {
    /**
     * @private
     * @member {FlowGraph}
     */
    this._graph = graph;
    /**
     * @private
     * @member {d3.selection}
     */
    this._svg = graph._graphCanvas;
    /**
     * Arrow container.
     * @private
     * @member {d3.selection}
     */
    this._container = undefined;
    /**
     * Arrow path.
     * @private
     * @member {d3.selection}
     */
    this._arrowPath = undefined;
    /**
     * Sensor path.
     * @private
     * @member {d3.selection}
     */
    this._sensorPath = undefined;
    /**
     * Delete button.
     * @private
     * @member {d3.selection}
     */
    this._button = undefined;
    /**
     * Arrow path generator.
     * @see https://github.com/d3/d3-shape/issues/27#issuecomment-256784743
     * @private
     * @member {Function}
     */
    this._pathGenerator = function(source, target) {
        return 'M' + source[0] + ', ' + source[1] +
               'C' + source[0] + ', ' + (source[1] + target[1]) / 2 + ' ' +
                     target[0] + ', ' + (source[1] + target[1]) / 2 + ' ' +
                     target[0] + ', ' + target[1];
    };
}


/**
 * @public
 * @static
 * @param {FlowGraph} graph
 * @returns {Arrow}
 */
Arrow.getInstance = function(graph) {

    return new Arrow(graph);
};


/**
 * Arrow drag event handler.
 * @public
 */
Arrow.prototype.drag = function() {

    var sourcePosition = this._source.getOutputPosition();
    var mousePosition = this._source.getMousePosition();
    var targetPosition = [mousePosition[0] + 2, mousePosition[1] - 2];

    this._update(sourcePosition, targetPosition);
};


/**
 * Update arrow position.
 * @private
 * @param {Number[]} start
 * @param {Number[]} finish
 */
Arrow.prototype._update = function(start, finish) {

    this._arrowPath.attr('d', this._pathGenerator(start, finish));
    this._sensorPath.attr('d', this._pathGenerator(start, finish));

    var x = (start[0] + finish[0]) / 2;
    var y = (start[1] + finish[1]) / 2;

    this._button.attr('transform', 'translate(' + x + ', ' + y + ')');
};


/**
 * Get source block id.
 * @public
 * @returns {Integer|undefined}
 */
Arrow.prototype.getSourceId = function() {

    if (this._source) {
        return this._source.getId();
    }
};


/**
 * Get target block id.
 * @public
 * @returns {Integer|undefined}
 */
Arrow.prototype.getTargetId = function() {

    if (this._target) {
        return this._target.getId();
    }
};


/**
 * Attach arrow path to target block.
 * @public
 * @param {Block} [block]
 * @returns
 */
Arrow.prototype.connectTo = function(block) {
    /*
     * Find target by input connector.
     */
    this._target = block || this._graph.getBlockById(d3.select(d3.event.sourceEvent.target).datum());
    /*
     * If target undefined or equals to itself - remove arrow path.
     */
    if (this._target == undefined || this._target == this._source || this._graph.isExists(this)) {
        return this.remove();
    }
    /*
     * Attach arrow to target input.
     */
    this.update();
    /*
     * Add arrow to the graph.
     */
    this._graph.addArrow(this);
    /*
     * Stash reference to this object.
     */
    var self = this;
    /*
     * Highlight arrow on hover.
     */
    this._sensorPath
        .style('pointer-events', 'all')
        .on('mouseover', function() {
            self._button.style('display', 'block');
            self._sensorPath.style('stroke', 'rgba(0, 176, 255, 0.1)');
        }).on('mouseout', function() {
            if (d3.event.relatedTarget.parentNode != self._button.node()) {
                self._button.style('display', null);
                self._sensorPath.style('stroke', null);
            }
        });
};


/**
 * Remove arrow.
 * @public
 */
Arrow.prototype.remove = function() {
    /*
     * Remove path.
     */
    this._container.remove();
    /*
     * Remove arrow from the graph.
     */
    this._graph.removeArrow(this);
};


/**
 * Update arrow coordinates.
 * @public
 */
Arrow.prototype.update = function() {

    var sourcePosition = this._source.getOutputPosition();
    var targetPosition = this._target.getInputPosition();

    this._update(sourcePosition, targetPosition);
};


/**
 * Attach arrow to source block.
 * @public
 * @param {Block} block
 * @returns {Arrow}
 */
Arrow.prototype.appendTo = function(block) {
    /*
     * Stash block as arrow source.
     */
    this._source = block;
    /*
     * Stash reference to this object.
     */
    var self = this;
    /*
     * Append arrow container to SVG element.
     */
    this._container = this._svg.append('g')
        .attr('class', 'arrow');
    /*
     * Append arrow path.
     */
    this._arrowPath = this._container.append('path')
        .attr('marker-end', 'url(#arrow-head)')
    /*
     * Append extra wider path for hover event detecting.
     */
    this._sensorPath = this._container.append('path')
        .attr('class', 'arrow-sensor')
        .style('pointer-events', 'none');
    /*
     * Appende remove button container.
     */
    this._button = this._container.append('g')
        .attr('class', 'arrow-remove-button')
        .attr('transform', 'translate(0, 0)')
        .on('mouseout', function() {
            if (d3.event.relatedTarget instanceof SVGSVGElement) {
                self._button.style('display', null);
                self._sensorPath.style('stroke', null);
            }
        }).on('click', function() {
            self.remove();
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

    return this;
};