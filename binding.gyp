{
	"targets": [{
		"target_name": "binding",
		"sources": ["deasync.cc"],
		"msvs_settings": {
			"VCLinkerTool": {
				"OptimizeReferences": 2
			}
		},
		"xcode_settings": {
        	"MACOSX_DEPLOYMENT_TARGET": "10.7"
        }
	}]
}
