define(function (require) {
    return {
        defaultOptions: function(plot) {
            plot.dataAtStep = this.dataAtStep;
            plot.setOptions({showlegend: false});
            plot.yaxisAutoRange = true;
            plot.xaxisAutoRange = false;
            plot.xVariable = window.time;
            plot.setOptions({xaxis: {title: 'Time (s)'}});
            plot.setOptions({yaxis: {title: '', tickmode: 'auto', type: 'category'}});
            plot.setOptions({margin: {l: 110, r: 10}});
            plot.limit = time[time.length-1];
            plot.resetAxes();
            plot.setName("Raster plot - " + Project.getActiveExperiment().getName());
            plot.isFunctionNode = true;
        },

        // return appropriate slice of the datasets for Plotly.animate
        dataAtStep: function (plot, step) {
            var dataAtStep = [];
            for (var dataset of plot.totalDatasets) {
                var newDataset = Object.assign({}, dataset);
                newDataset.x = newDataset.x.filter(v => v<=window.time.getTimeSeries()[step]);
                if ($.isEmptyObject(newDataset.x))
                    newDataset.x = [null];
                dataAtStep.push(newDataset);
            }
            return dataAtStep;
        }
    }
});
