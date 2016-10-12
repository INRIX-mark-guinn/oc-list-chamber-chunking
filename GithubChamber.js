define(function(require) {
    'use strict';

    const
        IDA = require('common/InternetDataAccessAPI'),
        ListDataHandlerBase = require('common/platform/ListDataHandlerBase'),
        ListChamber = require('common/platform/chamber/ListChamberAlpha');

    const PAGE_SIZE = 5;

    function fetchRepos(node) {
        if (node.fetchInfo && node.fetchInfo.page < 1) {
            node._data_tree_branch = [{itemType:'loadingPlaceholder'}];
        }

        return IDA.fetch(`https://api.github.com/search/repositories?sort=starts&order=desc&q=created:>2016-01-01&per_page=${PAGE_SIZE}&page=${node.fetchInfo.page + 1}`).then(response => {
            return {
                totalCount: response.data.total_count,
                items: response.data.items.map(item => {
                    return {
                        key:       item.id,
                        issuesUrl: item.issues_url,
                        text:      [item.full_name, item.description],
                        icon:      item.owner.avatar_url,
                        fetchInfo: {
                            fetchFunction: fetchIssues
                        }
                    }
                })
            }
        });
    }

    function fetchIssues(node) {
        const url = node.issuesUrl.replace('{/number}', '');
        return IDA.fetch(`${url}?sort=updated&direction=desc&per_page=${PAGE_SIZE}&page=${node.fetchInfo.page + 1}`).then(response => {
            if (!node._data_tree_branch) node._data_tree_branch = [];
            let totalCount = !response.data || response.data.length < PAGE_SIZE
                ? node._data_tree_branch.length + response.data.length
                : node._data_tree_branch.length + response.data.length + 1;
            return {
                totalCount,
                items: response.data.map(item => {
                    return {
                        key:  item.id,
                        text: [item.title, item.body],
                        icon: item.pull_request ? 'code-fork' : 'exclamation-circle',
                    }
                })
            }
        })
    }

    return class extends ListChamber {
        getListConfig() {
            return {
                dataChunkAutoLoad:true,
            };
        }

        data() {
            return {
                fetchInfo: {
                    fetchFunction: fetchRepos
                },
            }
        }
    }
});
