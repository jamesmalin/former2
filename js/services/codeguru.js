/* ========================================================================== */
// CodeGuru
/* ========================================================================== */

sections.push({
    'category': 'Machine Learning',
    'service': 'CodeGuru',
    'resourcetypes': {
        'Profiling Groups': {
            'columns': [
                [
                    {
                        field: 'state',
                        checkbox: true,
                        rowspan: 2,
                        align: 'center',
                        valign: 'middle'
                    },
                    {
                        title: 'Name',
                        field: 'name',
                        rowspan: 2,
                        align: 'center',
                        valign: 'middle',
                        sortable: true,
                        formatter: primaryFieldFormatter,
                        footerFormatter: textFormatter
                    },
                    {
                        title: 'Properties',
                        colspan: 4,
                        align: 'center'
                    }
                ],
                [
                    {
                        field: 'creationtime',
                        title: 'Creation Time',
                        sortable: true,
                        editable: true,
                        formatter: dateFormatter,
                        footerFormatter: textFormatter,
                        align: 'center'
                    }
                ]
            ]
        }
    }
});

async function updateDatatableMachineLearningCodeGuru() {
    blockUI('#section-machinelearning-codeguru-profilinggroups-datatable');

    await sdkcall("CodeGuruProfiler", "listProfilingGroups", {
        // no params
    }, true).then(async (data) => {
        $('#section-machinelearning-codeguru-profilinggroups-datatable').bootstrapTable('removeAll');

        data.profilingGroups.forEach(group => {
            $('#section-machinelearning-codeguru-profilinggroups-datatable').deferredBootstrapTable('append', [{
                f2id: group.arn,
                f2type: 'codeguru.profilinggroup',
                f2data: group,
                f2region: region,
                name: group.name,
                creationtime: group.createdAt
            }]);
        });
    }).catch(() => { });

    unblockUI('#section-machinelearning-codeguru-profilinggroups-datatable');
}

service_mapping_functions.push(function(reqParams, obj, tracked_resources){
    if (obj.type == "codeguru.profilinggroup") {
        reqParams.cfn['ProfilingGroupName'] = obj.data.name;

        tracked_resources.push({
            'obj': obj,
            'logicalId': getResourceName('codeguru', obj.id, 'AWS::CodeGuruProfiler::ProfilingGroup'),
            'region': obj.region,
            'service': 'codeguru',
            'type': 'AWS::CodeGuruProfiler::ProfilingGroup',
            'options': reqParams,
            'returnValues': {
                'Ref': obj.data.name,
                'GetAtt': {
                    'Arn': obj.data.arn
                },
                'Import': {
                    'ProfilingGroupName': obj.data.name
                }
            }
        });
    } else {
        return false;
    }

    return true;
});
