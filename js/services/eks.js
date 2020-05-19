/* ========================================================================== */
// EKS
/* ========================================================================== */

sections.push({
    'category': 'Compute',
    'service': 'EKS',
    'resourcetypes': {
        'Clusters': {
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
                        field: 'k8sversion',
                        title: 'Kubernetes Version',
                        sortable: true,
                        editable: true,
                        footerFormatter: textFormatter,
                        align: 'center'
                    },
                    {
                        field: 'platformversion',
                        title: 'Platform Version',
                        sortable: true,
                        editable: true,
                        footerFormatter: textFormatter,
                        align: 'center'
                    },
                    {
                        field: 'endpoint',
                        title: 'Endpoint',
                        sortable: true,
                        editable: true,
                        footerFormatter: textFormatter,
                        align: 'center'
                    }
                ]
            ]
        },
        'Node Groups': {
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
                        field: 'version',
                        title: 'Version',
                        sortable: true,
                        editable: true,
                        footerFormatter: textFormatter,
                        align: 'center'
                    },
                    {
                        field: 'releaseversion',
                        title: 'Release Version',
                        sortable: true,
                        editable: true,
                        footerFormatter: textFormatter,
                        align: 'center'
                    }
                ]
            ]
        }
    }
});

async function updateDatatableComputeEKS() {
    blockUI('#section-compute-eks-clusters-datatable');
    blockUI('#section-compute-eks-nodegroups-datatable');

    await sdkcall("EKS", "listClusters", {
        // no params
    }, true).then(async (data) => {
        $('#section-compute-eks-clusters-datatable').deferredBootstrapTable('removeAll');

        await Promise.all(data.clusters.map(async (cluster) => {
            return Promise.all([
                sdkcall("EKS", "describeCluster", {
                    name: cluster
                }, true).then((data) => {
                    $('#section-compute-eks-clusters-datatable').deferredBootstrapTable('append', [{
                        f2id: data.cluster.arn,
                        f2type: 'eks.cluster',
                        f2data: data.cluster,
                        f2region: region,
                        name: data.cluster.name,
                        k8sversion: data.cluster.version,
                        platformversion: data.cluster.platformVersion,
                        endpoint: data.cluster.endpoint
                    }]);
                }),
                sdkcall("EKS", "listNodegroups", {
                    clusterName: cluster
                }, true).then(async (data) => {
                    await Promise.all(data.nodegroups.map(async (nodegroup) => {
                        return sdkcall("EKS", "describeNodegroup", {
                            clusterName: cluster,
                            nodegroupName: nodegroup
                        }, true).then((data) => {
                            $('#section-compute-eks-nodegroups-datatable').deferredBootstrapTable('append', [{
                                f2id: data.nodegroup.nodegroupArn,
                                f2type: 'eks.nodegroup',
                                f2data: data.nodegroup,
                                f2region: region,
                                name: data.nodegroup.nodegroupName,
                                version: data.nodegroup.version,
                                releaseversion: data.nodegroup.releaseVersion
                            }]);
                        });
                    }));
                })
            ]);
        }));

        unblockUI('#section-compute-eks-clusters-datatable');
        unblockUI('#section-compute-eks-nodegroups-datatable');
    });
}

service_mapping_functions.push(function(reqParams, obj, tracked_resources){
    if (obj.type == "eks.cluster") {
        reqParams.cfn['Name'] = obj.data.name;
        reqParams.tf['name'] = obj.data.name;
        reqParams.cfn['RoleArn'] = obj.data.roleArn;
        reqParams.tf['role_arn'] = obj.data.roleArn;
        reqParams.cfn['Version'] = obj.data.version;
        reqParams.tf['version'] = obj.data.version;
        if (obj.data.resourcesVpcConfig) {
            reqParams.cfn['ResourcesVpcConfig'] = {
                'SecurityGroupIds': obj.data.resourcesVpcConfig.securityGroupIds,
                'SubnetIds': obj.data.resourcesVpcConfig.subnetIds
            };
            reqParams.tf['vpc_config'] = {
                'security_group_ids': obj.data.resourcesVpcConfig.securityGroupIds,
                'subnet_ids': obj.data.resourcesVpcConfig.subnetIds
            };
        }
        if (obj.data.encryptionConfig && obj.data.encryptionConfig.length) {
            reqParams.cfn['EncryptionConfig'] = [];
            
            obj.data.encryptionConfig.forEach(encryptionconfig => {
                var provider = null;
                if (encryptionconfig.provider) {
                    provider = {
                        'KeyArn': encryptionconfig.provider.keyArn
                    };
                }
                reqParams.cfn['EncryptionConfig'].push({
                    'Provider': provider,
                    'Resources': encryptionconfig.resources
                });
            });
        }

        tracked_resources.push({
            'obj': obj,
            'logicalId': getResourceName('eks', obj.id, 'AWS::EKS::Cluster'),
            'region': obj.region,
            'service': 'eks',
            'type': 'AWS::EKS::Cluster',
            'terraformType': 'aws_eks_cluster',
            'options': reqParams
        });
    } else if (obj.type == "eks.nodegroup") {
        reqParams.cfn['NodegroupName'] = obj.data.nodegroupName;
        reqParams.cfn['ClusterName'] = obj.data.clusterName;
        reqParams.cfn['Version'] = obj.data.version;
        reqParams.cfn['ReleaseVersion'] = obj.data.releaseVersion;
        if (obj.data.scalingConfig) {
            reqParams.cfn['ScalingConfig'] = {
                'MinSize': obj.data.scalingConfig.minSize,
                'MaxSize': obj.data.scalingConfig.maxSize,
                'DesiredSize': obj.data.scalingConfig.desiredSize
            };
        }
        reqParams.cfn['InstanceTypes'] = obj.data.instanceTypes;
        reqParams.cfn['Subnets'] = obj.data.subnets;
        if (obj.data.remoteAccess) {
            reqParams.cfn['RemoteAccess'] = {
                'Ec2SshKey': obj.data.remoteAccess.ec2SshKey,
                'SourceSecurityGroups': obj.data.remoteAccess.sourceSecurityGroups
            };
        }
        reqParams.cfn['AmiType'] = obj.data.amiType;
        reqParams.cfn['NodeRole'] = obj.data.nodeRole;
        reqParams.cfn['Labels'] = obj.data.labels;
        reqParams.cfn['DiskSize'] = obj.data.diskSize;
        reqParams.cfn['Tags'] = obj.data.tags;

        /*
        TODO:
        ForceUpdateEnabled: Boolean
        */

        tracked_resources.push({
            'obj': obj,
            'logicalId': getResourceName('eks', obj.id, 'AWS::EKS::Nodegroup'),
            'region': obj.region,
            'service': 'eks',
            'type': 'AWS::EKS::Nodegroup',
            'options': reqParams
        });
    } else {
        return false;
    }

    return true;
});
