import re
import math

def scale_rotate_gcode(input_file, scale_factor, angle, output_stream):
    layer_height = 0.3  # Must match the layer height the gcode was sliced with
    z_movement_pattern = re.compile(r'G1 .*Z(\d*\.\d+|\d+\.\d*)')
    z_comment_pattern = re.compile(r'^;Z:(\d*\.\d+|\d+\.\d*)')
    centroid_x_pattern = re.compile(r';firstLayerCenterX = (\d*\.\d+|\d+\.?\d*)')
    centroid_y_pattern = re.compile(r';firstLayerCenterY = (\d*\.\d+|\d+\.?\d*)')
    layer_height_pattern = re.compile(r'^; layer_height = (\d*\.?\d+)')

    current_z_height = 0.0
    layer_index = 0
    scaled_lines = []
    original_centroid_x = original_centroid_y = None
    sliced_layer_height = None

    angle_rad = math.radians(angle)

    # Pre-pass: read the first-layer centroid and the layer height the file
    # was actually sliced with (both are PrusaSlicer-generated comments).
    with open(input_file, 'r') as infile:
        for line in infile:
            centroid_x_match = centroid_x_pattern.match(line)
            if centroid_x_match:
                original_centroid_x = float(centroid_x_match.group(1))
            centroid_y_match = centroid_y_pattern.match(line)
            if centroid_y_match:
                original_centroid_y = float(centroid_y_match.group(1))
            layer_height_match = layer_height_pattern.match(line)
            if layer_height_match:
                sliced_layer_height = float(layer_height_match.group(1))

    # Fail loudly rather than emit geometrically wrong gcode: both checks
    # protect against files sliced without the provided PrusaSlicer profile.
    if original_centroid_x is None or original_centroid_y is None:
        raise ValueError(
            "GCode file is missing the 'firstLayerCenterX/Y' comments needed to "
            "scale and rotate. Re-slice the model with the provided PrusaSlicer profile.")
    if sliced_layer_height is not None and abs(sliced_layer_height - layer_height) > 1e-6:
        raise ValueError(
            f"GCode was sliced with a {sliced_layer_height} mm layer height, but this "
            f"transform assumes {layer_height} mm, so the output Z heights would be wrong. "
            "Re-slice the model with the provided PrusaSlicer profile.")

    with open(input_file, 'r') as file:
        for line in file:
            z_match = z_movement_pattern.match(line)
            z_comment_match = z_comment_pattern.match(line)

            if z_comment_match:
                current_z_height = layer_height * layer_index * scale_factor
                scaled_lines.append(f';Z:{current_z_height:.2f}\n')
                continue

            if z_match:
                current_z_height = layer_height * layer_index * scale_factor
                new_line = re.sub(z_movement_pattern, f'G1 Z{current_z_height:.3f}', line)
                scaled_lines.append(new_line)
                continue

            if ';LAYER_CHANGE' in line:
                layer_index += 1

            if line.startswith('G1 ') and (' X' in line or ' Y' in line):
                x_match = re.search(r' X([-\d.]+)', line)
                y_match = re.search(r' Y([-\d.]+)', line)
                if x_match and y_match:
                    x_val = float(x_match.group(1))
                    y_val = float(y_match.group(1))

                    x_scaled = (x_val - original_centroid_x) * scale_factor + original_centroid_x
                    y_scaled = (y_val - original_centroid_y) * scale_factor + original_centroid_y

                    x_rotated = (x_scaled - original_centroid_x) * math.cos(angle_rad) - (y_scaled - original_centroid_y) * math.sin(angle_rad) + original_centroid_x
                    y_rotated = (x_scaled - original_centroid_x) * math.sin(angle_rad) + (y_scaled - original_centroid_y) * math.cos(angle_rad) + original_centroid_y

                    new_line = re.sub(r' X[-\d.]+', f' X{x_rotated:.3f}', line)
                    new_line = re.sub(r' Y[-\d.]+', f' Y{y_rotated:.3f}', new_line)
                    line = new_line
                    scaled_lines.append(line)
                    continue

            scaled_lines.append(line)

    # Write the scaled and rotated GCode to the provided output stream
    for line in scaled_lines:
        output_stream.write(line.encode('utf-8'))
