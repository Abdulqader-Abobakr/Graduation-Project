<?php
echo 'Upload Max: ' . ini_get('upload_max_filesize') . "\n";
echo 'Post Max: ' . ini_get('post_max_size') . "\n";
echo 'Temp Dir: ' . (ini_get('upload_tmp_dir') ?: sys_get_temp_dir()) . "\n";
