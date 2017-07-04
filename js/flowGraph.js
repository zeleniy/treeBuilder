/**
 * @public
 * @class
 */
function FlowGraph() {
    /**
     * @private
     * @member {d3.selection}
     */
    this._container = undefined;
    /**
     * @private
     * @member {d3.selection}
     */
    this._leftSideContainer = undefined;
    /**
     * @private
     * @member {d3.selection}
     */
    this._rightSideContainer = undefined;
    /**
     * @private
     * @member {Integer}
     */
    this._blockHeight = 40;
    /**
     * @private
     * @member {Object[]}
     */
    this._blocksList = undefined;
    /**
     * @private
     * @member {Number}
     */
    this._leftSideWidth = 220;
    /**
     * Dragged block.
     * @private
     * @member {Block}
     */
    this._draggedBlock = undefined;
    /**
     * Displayed block.
     * @private
     * @member {Block}
     */
    this._displayedBlock = undefined;
    /**
     * Blocks list.
     * @private
     * @member {Object}
     */
    this._blocks = {};
    /**
     * Arrows list.
     * @private
     * @member {Arrow[]}
     */
    this._arrows = [];
    /**
     * Unique id counter.
     * @private
     * @member {Integer}
     */
    this._counter = 0;
    /**
     * Zoom behaviour handler.
     * @private
     * @member {d3.zoom}
     */
    this._zoom = d3.zoom()
        .scaleExtent([0.4, 2.5])
        .on('zoom', function() {
            self._graphCanvas.attr('transform', d3.event.transform);
        });
    /*
     * Register window resize event handler.
     */
    var self = this;
    d3.select(window).on('resize.flow-chart', function() {
        self.resize();
    });
}


/**
 * @public
 * @static
 * @returns {FlowGraph}
 */
FlowGraph.getInstance = function() {

    return new FlowGraph();
};


/**
 * Check arrow already exists.
 * @public
 * @param {Arrow} arrow
 * @returns {Boolean}
 */
FlowGraph.prototype.isExists = function(arrow) {

    return this._arrows.filter(function(a) {
        if (a._source == arrow._source && a._target == arrow._target) {
            return true;
        }
    }).length > 0;
};


/**
 * Remove arrow.
 * @param {Arrow} arrow
 */
FlowGraph.prototype.removeBlock = function(block) {

    delete this._blocks[block.getId()];
};


/**
 * Remove arrow.
 * @param {Arrow} arrow
 */
FlowGraph.prototype.removeArrow = function(arrow) {
    /*
     * Get arrow index.
     */
    var index = this._arrows.indexOf(arrow);
    /*
     * Remove it from array.
     */
    if (index > -1) {
        this._arrows.splice(index, 1);
    }
};


/**
 * Add arrow.
 * @param {Arrow} arrow
 */
FlowGraph.prototype.addArrow = function(arrow) {

    this._arrows.push(arrow);
};


/**
 * Clear right side from any information.
 * @public
 * @param {Block} block
 */
FlowGraph.prototype.clearRightSide = function(block) {

    if (block == undefined || block == this._displayedBlock) {
        this._rightSideContainer.selectAll('*').remove();
    }
};


/**
 * Display block data on right side.
 * @public
 * @param block
 */
FlowGraph.prototype.displayBlockData = function(block) {
    /*
     * Stash reference to this object.
     */
    var self = this;
    /*
     * Clear right side.
     */
    this.clearRightSide();
    /*
     * Stash block. We will clear right side if block will be delated.
     */
    this._displayedBlock = block;
    /*
     * Get block data.
     */
    var data = block.getContainer().datum().Data;
    /*
     * Check textarea.
     */
    var isTextArea = 'FieldType' in data && data['FieldType'] == 'textarea';
    /*
     * Populate right side with data.
     */
    for (var i in data) {
        /*
         * Create property block.
         */
        var display = this._rightSideContainer.append('div')
            .attr('class', 'display-block')
            .datum({
                'name' : i,
                'value' : data[i]
            });
        /*
         * Append property title.
         */
        display.append('span')
            .attr('class', 'display-property-title')
            .text(function(d) {
                return d.name;
            });
        /*
         * Append editable property value.
         */
        if (isTextArea && i == 'Value') {
            self._appendTextareaBlock(display, block, i);
        } else if (i == 'FieldType') {
            display.append('select')
                .attr('class', 'display-property-value')
                .on('change', function() {
                    /*
                     * Find value field.
                     */
                    var valueField = self._rightSideContainer.selectAll('.display-property-value')
                        .filter(function(d) {
                            return d.name == 'Value';
                        });
                    /*
                     * Get it parent node.
                     */
                    var container = d3.select(valueField.node().parentNode);
                    /*
                     * Remove it.
                     */
                    valueField.remove();
                    /*
                     * Get selected value.
                     */
                    var value = this.options[this.selectedIndex].innerText;
                    /*
                     * Update block property.
                     */
                    self._updateBlock(block, this);
                    /*
                     * Add new field.
                     */
                    if (this.options[this.selectedIndex].innerText == 'textarea') {
                        self._appendTextareaBlock(container, block, 'Value');
                    } else {
                        self._appendInputBlock(container, block, 'Value');
                    }
                }).selectAll('option')
                .data(['textarea', 'single-line'])
                .enter()
                .append('option')
                .property('value', function(d, i) {
                    return d;
                }).property('selected', function(d) {
                    return d == data[i];
                }).text(function(d) {
                    return d;
                });
        } else {
            self._appendInputBlock(display, block, i);
        }
    }
};


/**
 * Append textarea to right side property list.
 * @private
 * @param {d3.selection} container
 * @param {Block} block
 * @param {String} name
 */
FlowGraph.prototype._appendTextareaBlock = function(container, block, name) {

    var self = this;
    container.append('textarea')
        .attr('class', 'display-property-value')
        .attr('rows', 5)
        .text(function() {
            return block.getValue(name);
        }).on('input', function() {
            self._updateBlock(block, this);
        });
};


/**
 * Append input tag to right side property list.
 * @private
 * @param {d3.selection} container
 * @param {Block} block
 * @param {String} name
 */
FlowGraph.prototype._appendInputBlock = function(container, block, name) {

    var self = this;
    container.append('input')
        .attr('class', 'display-property-value')
        .property('value', function() {
            return block.getValue(name);
        }).on('input', function() {
            self._updateBlock(block, this);
        });
};


/**
 * Update block data.
 * @private
 * @param {Block} block
 * @param {HTMLElement} element
 */
FlowGraph.prototype._updateBlock = function(block, element) {

    var data = d3.select(element.parentNode).datum();

    var name = data.name;
    var value = d3.select(element).property('value');

    block.setValue(name, value);
};


/**
 * @public
 * @param {Object[]} blocksList
 * @returns {FlowGraph}
 */
FlowGraph.prototype.setBlocksList = function(blocksList) {

    this._blocksList = blocksList;
    return this;
};


/**
 * Convert graph to JSON.
 * @public
 * @returns {Object}
 */
FlowGraph.prototype.toJson = function() {

    var blocks = [];

    for (var i in this._blocks) {
        blocks.push(this._blocks[i].toJson());
    }

    return {
        'transform': this.getViewportTransform(),
        'nodes' : blocks,
        'links' : this._arrows.map(function(arrow) {
            return {
                'source' : arrow.getSourceId(),
                'target' : arrow.getTargetId()
            }
        })
    }
};


/**
 * Reize SVG element.
 * @public
 * @returns {FlowGraph}
 */
FlowGraph.prototype.resize = function() {

    var dimension = this._leftSideContainer.node().getBoundingClientRect();

    this._svg
        .attr('width', dimension.width)
        .attr('height', dimension.height);

    this._leftSideBackground
        .attr('width', this._leftSideWidth)
        .attr('height', dimension.height);
};


/**
 * Render app.
 * @public
 * @param {String} selector - CSS selector
 * @param {Object} [graphData]
 * @returns {FlowGraph}
 */
FlowGraph.prototype.render = function(selector, graphData) {

    var self = this;

    this._container = d3.select(selector);

    var container = this._container.append('div')
        .attr('class', 'flow-graph');

    this._topSideContainer = container.append('div')
        .attr('class', 'top-side');

    this._topSideContainer.append('div')
        .attr('class', 'controls')
        .text('save')

    this._leftSideContainer = container.append('div')
        .attr('class', 'viewport');

    container.append('div')
        .attr('class', 'left-side');

    this._rightSideContainer = container.append('div')
        .attr('class', 'right-side');

    this._svg = this._leftSideContainer.append('svg');

    this._graphCanvas = this._svg.append('g')
        .attr('class', 'graph-canvas');

    this._blocksCanvas = this._svg.append('g')
        .attr('class', 'blocks-canvas');

    this._leftSideBackground = this._blocksCanvas.append('rect')
        .attr('class', 'background');

    this._svg.call(this._zoom.transform, function() {
            return d3.zoomIdentity.translate(self._leftSideWidth, 0);
        }).call(this._zoom)
        /*
         * Fix zoom in on "zoom out" double click.
         * See https://github.com/d3/d3-zoom/issues/69#issuecomment-258235734
         */
        .on("dblclick.zoom", null);

    defs = this._svg.append('defs')
    /*
     * Append arrows head marker.
     * See http://bl.ocks.org/tomgp/d59de83f771ca2b6f1d4
     */
    defs.append('marker')
        .attr('id', 'arrow-head')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 5)
        .attr('refY', 0)
        .attr('markerWidth', 4)
        .attr('markerHeight', 4)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('class', 'arrow-head');

    this._renderZoomButtons();

    this.resize();

    this._blockWidth = this._leftSideWidth * 0.9;
    this._blockOffset = this._leftSideWidth * 0.1 / 2;

    this._renderBlocks();

    this._renderGraph(graphData);

    return this;
};


/**
 * Render zoom buttons.
 * @private
 */
FlowGraph.prototype._renderZoomButtons = function() {
    /*
     * Stash reference to this object.
     */
    var self = this;
    /*
     * Render buttons containers and register click event handlers.
     */
    var zoomButtons = this._svg.append('g')
        .attr('class', 'zoom-controls')
        .attr('transform', 'translate(' + (this._leftSideWidth + 10) + ', ' + 10 + ')')
        .selectAll('g')
        .data(['in', 'out'])
        .enter()
        .append('g')
        .attr('transform', function(d, i) {
            return 'translate(' + (i * 30) + ', 0)'
        }).on('click', function(d) {
            if (d == 'in') {
                self._zoom.scaleBy(self._svg.transition().duration(750), 1.3);
            } else {
                self._zoom.scaleBy(self._svg.transition().duration(750), 1 / 1.3);
            }
        });
    /*
     * Append buttons rectangles.
     */
    zoomButtons.append('rect')
        .attr('width', 30)
        .attr('height', 30);
    /*
     * Draw plus and minus symbols within rectangles.
     */
    zoomButtons.each(function(d, i) {
        /*
         * Defined lines.
         */
        var lines;
        /*
         * Push data into lines.
         */
        if (d == 'in') {
            lines = d3.select(this).selectAll('line')
                .data([[5, 15, 25, 15], [15, 5, 15, 25]])
                .enter()
                .append('line');
        } else {
            lines = d3.select(this).selectAll('line')
                .data([[5, 15, 25, 15]])
                .enter()
                .append('line');
        }
        /*
         * Apply data.
         */
        lines.attr('x1', function(d, i) {
                return d[0];
            }).attr('y1', function(d, i) {
                return d[1];
            }).attr('x2', function(d, i) {
                return d[2];
            }).attr('y2', function(d, i) {
                return d[3];
            });
    })
};


/**
 * Render graph from JSON.
 * @private
 * @param {Object} graphData
 * @param {Object[]} graphData.nodes - nodes array
 * @param {Object[]} graphData.links - links array
 */
FlowGraph.prototype._renderGraph = function(graphData) {

    if (! graphData) {
        return;
    }

    var identity = d3.zoomIdentity
        .translate(graphData.transform.x, graphData.transform.y)
        .scale(graphData.transform.k);

    this._svg.call(this._zoom.transform, identity);

    var self = this;

    graphData.nodes.forEach(function(node) {
        var block = Block.getInstance(self, self._blockWidth, self._blockHeight)
            .setId(node.id)
            .setData(node.data, node.index)
            .setOffset(self._blockOffset)
            .render(self._graphCanvas)
            .upgrade(true)
            .setPosition(node.position);

        self._registerBlock(block);
    });

    this._counter = d3.max(graphData.nodes, function(d) {
        return d.id;
    }) + 1;

    graphData.links.forEach(function(link) {
        var arrow = Arrow.getInstance(this)
            .appendTo(this.getBlockById(link.source))
            .connectTo(this.getBlockById(link.target));
    }, this);
};


FlowGraph.prototype.getViewportTransform = function() {

    return d3.zoomTransform(this._svg.node())
};


/**
 * Render blocks list.
 */
FlowGraph.prototype._renderBlocks = function() {
    /*
     * Stash reference to this object.
     */
    var self = this;
    /*
     * Render block's containers.
     */
    this._blocksList.nodes.forEach(function(d, i) {
        Block.getInstance(this, self._blockWidth, self._blockHeight)
            .setData(d, i)
            .setOffset(this._blockOffset)
            .render(this._blocksCanvas)
            .setPosition([
                this._blockOffset,
                this._blockOffset * (i + 1) + this._blockHeight * i
            ]);
    }, this);
};


/**
 * @public
 * @param {Integer} id
 * @returns {Block}
 */
FlowGraph.prototype.getBlockById = function(id) {

    return this._blocks[id];
};


/**
 * Find block's arrows.
 * @param {Block} block
 * @returns {Arrow[]}
 */
FlowGraph.prototype.getBlockArrows = function(block) {

    return this._arrows.filter(function(arrow) {
        if (arrow._source == block || arrow._target == block) {
            return true;
        }
    });
};


/**
 * Set up block on viewport.
 * @private
 * @param {Block} block
 */
FlowGraph.prototype._registerBlock = function(block) {
    /*
     * Restore block initial color.
     */
    block.getContainer().style('fill', null);
    /*
     * Register block in graph.
     */
    this._blocks[block.getId()] = block;
};


/**
 * Move instance back and remove.
 * @private
 * @param {Block} block
 * @param {Integer} i
 */
FlowGraph.prototype._removeBlock = function(block, i) {
    /*
     * Stash reference to this object.
     */
    var self = this;
    /*
     * Calculate final coordinates (coordinates of template blocks).
     */
    var x = this._blockOffset;
    var y = this._blockOffset * (i + 1) + this._blockHeight * i;
    /*
     * Get block current coordinates.
     */
    var position = this._draggedBlock.getPosition();
    /*
     * Create coordinates interpolators.
     */
    var xInterpolator = d3.interpolate(position[0], x);
    var yInterpolator = d3.interpolate(position[1], y);
    /*
     * Update arrows coordinates.
     */
    var arrows = this.getBlockArrows(this._draggedBlock);
    /*
     * Start transition.
     */
    block.getContainer().transition()
        .duration(500)
        .attrTween('transform', function() {
            return function(i) {
                /*
                 * Calculate new coordinates.
                 */
                var newX = xInterpolator(i);
                var newY = yInterpolator(i);
                /*
                 * Update block coordinates.
                 */
                self._draggedBlock.setPosition([newX, newY]);
                /*
                 * Update arrow's coordinates.
                 */
                arrows.forEach(function(arrow) {
                    arrow.update();
                });
                /*
                 * Return attribute new value.
                 */
                return 'translate(' + newX + ', ' + newY + ')';
            };
        }).on('end', function() {
            block.remove();
        });
};